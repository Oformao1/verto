import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { processBookingCredits, reverseBookingCredits, getUserCreditBalance } from '@/lib/credits'
import { config } from '@/lib/config'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const booking = await prisma.bookingRequest.findUnique({
      where: { id },
      include: {
        listing: {
          include: {
            host: {
              select: { id: true, name: true, photo: true, email: true },
            },
            photos: true,
          },
        },
        guest: {
          select: { id: true, name: true, photo: true, email: true },
        },
        host: {
          select: { id: true, name: true, photo: true, email: true },
        },
        reviews: true,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Only guest or host can view
    if (booking.guestId !== session.user.id && booking.hostId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Include key instructions only for confirmed bookings
    let keyInstructions = null
    if (booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') {
      keyInstructions = booking.listing.keyInstructions
    }

    return NextResponse.json({
      ...booking,
      listing: {
        ...booking.listing,
        keyInstructions,
        fullAddress:
          booking.status === 'CONFIRMED' || booking.status === 'COMPLETED'
            ? booking.listing.fullAddress
            : null,
      },
    })
  } catch (error) {
    console.error('Booking fetch error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body // 'accept', 'decline', 'cancel', 'complete'

    const booking = await prisma.bookingRequest.findUnique({
      where: { id },
      include: { listing: true },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    switch (action) {
      case 'accept': {
        // Only host can accept
        if (booking.hostId !== session.user.id) {
          return NextResponse.json({ error: 'Only the host can accept' }, { status: 403 })
        }

        if (booking.status !== 'REQUESTED') {
          return NextResponse.json(
            { error: 'Can only accept requested bookings' },
            { status: 400 }
          )
        }

        // Check guest still has enough credits
        const guestBalance = await getUserCreditBalance(booking.guestId)
        if (guestBalance < booking.creditsTotal) {
          return NextResponse.json(
            { error: 'Guest no longer has sufficient credits' },
            { status: 400 }
          )
        }

        // Process credit transfer
        await processBookingCredits(
          booking.guestId,
          booking.hostId,
          booking.id,
          booking.creditsTotal
        )

        // Update booking status
        await prisma.bookingRequest.update({
          where: { id },
          data: { status: 'CONFIRMED' },
        })

        return NextResponse.json({ message: 'Booking confirmed' })
      }

      case 'decline': {
        // Only host can decline
        if (booking.hostId !== session.user.id) {
          return NextResponse.json({ error: 'Only the host can decline' }, { status: 403 })
        }

        if (booking.status !== 'REQUESTED') {
          return NextResponse.json(
            { error: 'Can only decline requested bookings' },
            { status: 400 }
          )
        }

        await prisma.bookingRequest.update({
          where: { id },
          data: { status: 'DECLINED' },
        })

        return NextResponse.json({ message: 'Booking declined' })
      }

      case 'cancel': {
        // Both guest and host can cancel
        if (booking.guestId !== session.user.id && booking.hostId !== session.user.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
          return NextResponse.json(
            { error: 'Cannot cancel this booking' },
            { status: 400 }
          )
        }

        // If booking was confirmed, handle credit reversal
        if (booking.status === 'CONFIRMED') {
          const now = new Date()
          const hoursUntilStart =
            (booking.startDate.getTime() - now.getTime()) / (1000 * 60 * 60)

          // Full reversal if cancelled more than 48 hours before start
          if (hoursUntilStart > config.cancellationWindowHours) {
            await reverseBookingCredits(
              booking.guestId,
              booking.hostId,
              booking.id,
              booking.creditsTotal
            )
          }
          // Otherwise no reversal (host keeps credits)
        }

        await prisma.bookingRequest.update({
          where: { id },
          data: { status: 'CANCELLED' },
        })

        return NextResponse.json({ message: 'Booking cancelled' })
      }

      case 'complete': {
        // Only host can mark as complete
        if (booking.hostId !== session.user.id) {
          return NextResponse.json(
            { error: 'Only the host can mark as complete' },
            { status: 403 }
          )
        }

        if (booking.status !== 'CONFIRMED') {
          return NextResponse.json(
            { error: 'Can only complete confirmed bookings' },
            { status: 400 }
          )
        }

        // Check if stay has ended
        const now = new Date()
        if (booking.endDate > now) {
          return NextResponse.json(
            { error: 'Cannot complete booking before end date' },
            { status: 400 }
          )
        }

        await prisma.bookingRequest.update({
          where: { id },
          data: { status: 'COMPLETED' },
        })

        return NextResponse.json({ message: 'Booking marked as complete' })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Booking update error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
