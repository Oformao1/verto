import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { messageSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')

    const { prisma } = await import('@/lib/prisma')

    if (bookingId) {
      // Get messages for a specific booking
      const booking = await prisma.bookingRequest.findUnique({
        where: { id: bookingId },
      })

      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }

      if (booking.guestId !== session.user.id && booking.hostId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const messages = await prisma.message.findMany({
        where: { bookingId },
        include: {
          sender: {
            select: { id: true, name: true, photo: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      })

      // Mark messages as read
      await prisma.message.updateMany({
        where: {
          bookingId,
          senderId: { not: session.user.id },
          read: false,
        },
        data: { read: true },
      })

      return NextResponse.json({ messages })
    }

    // Get all conversations (bookings with messages)
    const bookings = await prisma.bookingRequest.findMany({
      where: {
        OR: [{ guestId: session.user.id }, { hostId: session.user.id }],
      },
      include: {
        listing: {
          select: { title: true },
        },
        guest: {
          select: { id: true, name: true, photo: true },
        },
        host: {
          select: { id: true, name: true, photo: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: {
                senderId: { not: session.user.id },
                read: false,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    const conversations = bookings.map((booking) => ({
      bookingId: booking.id,
      listing: booking.listing,
      otherUser:
        booking.guestId === session.user.id ? booking.host : booking.guest,
      lastMessage: booking.messages[0] || null,
      unreadCount: booking._count.messages,
      status: booking.status,
    }))

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Messages fetch error:', error)
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
    const validationResult = messageSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const { bookingId, body: messageBody } = validationResult.data

    const { prisma } = await import('@/lib/prisma')

    // Check booking exists and user is participant
    const booking = await prisma.bookingRequest.findUnique({
      where: { id: bookingId },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.guestId !== session.user.id && booking.hostId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check for blocking
    const otherUserId =
      booking.guestId === session.user.id ? booking.hostId : booking.guestId

    const isBlocked = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: otherUserId, blockedId: session.user.id },
          { blockerId: session.user.id, blockedId: otherUserId },
        ],
      },
    })

    if (isBlocked) {
      return NextResponse.json(
        { error: 'You cannot message this user' },
        { status: 400 }
      )
    }

    const message = await prisma.message.create({
      data: {
        bookingId,
        senderId: session.user.id,
        body: messageBody,
      },
      include: {
        sender: {
          select: { id: true, name: true, photo: true },
        },
      },
    })

    // Update booking's updatedAt for conversation ordering
    await prisma.bookingRequest.update({
      where: { id: bookingId },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({
      message: 'Message sent',
      data: message,
    })
  } catch (error) {
    console.error('Message create error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
