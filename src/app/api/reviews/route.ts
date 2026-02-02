import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { reviewSchema } from '@/lib/validations'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const role = searchParams.get('role') // 'reviewer' or 'reviewee'

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const where: Record<string, unknown> =
      role === 'reviewer' ? { reviewerId: userId } : { revieweeId: userId }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        reviewer: {
          select: { id: true, name: true, photo: true },
        },
        reviewee: {
          select: { id: true, name: true, photo: true },
        },
        booking: {
          select: {
            listing: {
              select: { title: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('Reviews fetch error:', error)
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
    const validationResult = reviewSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const { bookingId, rating, text } = validationResult.data

    // Check booking exists and is completed
    const booking = await prisma.bookingRequest.findUnique({
      where: { id: bookingId },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Can only review completed bookings' },
        { status: 400 }
      )
    }

    // Check user is participant
    if (booking.guestId !== session.user.id && booking.hostId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Determine reviewee
    const revieweeId =
      booking.guestId === session.user.id ? booking.hostId : booking.guestId

    // Check if already reviewed
    const existingReview = await prisma.review.findUnique({
      where: {
        bookingId_reviewerId: {
          bookingId,
          reviewerId: session.user.id,
        },
      },
    })

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this booking' },
        { status: 400 }
      )
    }

    const review = await prisma.review.create({
      data: {
        bookingId,
        reviewerId: session.user.id,
        revieweeId,
        rating,
        text,
      },
    })

    return NextResponse.json({
      message: 'Review created',
      review,
    })
  } catch (error) {
    console.error('Review create error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
