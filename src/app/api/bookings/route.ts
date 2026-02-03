import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { bookingRequestSchema } from '@/lib/validations'
import { calculateNights } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') // 'guest' or 'host'
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}

    if (role === 'host') {
      where.hostId = session.user.id
    } else {
      where.guestId = session.user.id
    }

    if (status) {
      where.status = status
    }

    const { prisma } = await import('@/lib/prisma')

    const bookings = await prisma.bookingRequest.findMany({
      where,
      include: {
        listing: {
          include: {
            photos: { take: 1 },
          },
        },
        guest: {
          select: { id: true, name: true, photo: true },
        },
        host: {
          select: { id: true, name: true, photo: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Bookings fetch error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validationResult = bookingRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const { listingId, startDate, endDate, guestMessage, purpose } = validationResult.data

    const { prisma } = await import('@/lib/prisma')
    const { getUserCreditBalance } = await import('@/lib/credits')

    // Fetch listing
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (!listing.isActive) {
      return NextResponse.json({ error: 'Listing is not active' }, { status: 400 })
    }

    // Check if user is the host
    if (listing.hostId === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot book your own listing' },
        { status: 400 }
      )
    }

    // Check for blocking
    const isBlocked = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: listing.hostId, blockedId: session.user.id },
          { blockerId: session.user.id, blockedId: listing.hostId },
        ],
      },
    })

    if (isBlocked) {
      return NextResponse.json(
        { error: 'You cannot book this listing' },
        { status: 400 }
      )
    }

    // Calculate credits
    const nights = calculateNights(startDate, endDate)
    if (nights < 1) {
      return NextResponse.json(
        { error: 'Stay must be at least 1 night' },
        { status: 400 }
      )
    }

    const creditsTotal = nights * listing.creditsPerNight

    // Check credit balance
    const balance = await getUserCreditBalance(session.user.id)
    if (balance < creditsTotal) {
      return NextResponse.json(
        { error: `Insufficient credits. You need ${creditsTotal} but have ${balance}` },
        { status: 400 }
      )
    }

    // Check availability (no overlapping confirmed bookings or availability blocks)
    const conflictingBooking = await prisma.bookingRequest.findFirst({
      where: {
        listingId,
        status: 'CONFIRMED',
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    })

    if (conflictingBooking) {
      return NextResponse.json(
        { error: 'These dates are not available' },
        { status: 400 }
      )
    }

    const conflictingBlock = await prisma.availabilityBlock.findFirst({
      where: {
        listingId,
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    })

    if (conflictingBlock) {
      return NextResponse.json(
        { error: 'These dates are blocked by the host' },
        { status: 400 }
      )
    }

    // Create booking request
    const booking = await prisma.bookingRequest.create({
      data: {
        listingId,
        guestId: session.user.id,
        hostId: listing.hostId,
        startDate,
        endDate,
        creditsTotal,
        guestMessage,
        purpose,
        status: 'REQUESTED',
      },
    })

    return NextResponse.json({
      message: 'Booking request sent',
      booking,
    })
  } catch (error) {
    console.error('Booking create error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
