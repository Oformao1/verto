import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { vouchSchema } from '@/lib/validations'
import { config } from '@/lib/config'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const { prisma } = await import('@/lib/prisma')

    const vouches = await prisma.vouch.findMany({
      where: { toUserId: userId },
      include: {
        fromUser: {
          select: { id: true, name: true, photo: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ vouches })
  } catch (error) {
    console.error('Vouches fetch error:', error)
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
    const validationResult = vouchSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const { toUserId, relationshipType, note } = validationResult.data

    // Check if trying to vouch for self
    if (toUserId === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot vouch for yourself' },
        { status: 400 }
      )
    }

    const { prisma } = await import('@/lib/prisma')

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: toUserId },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if voucher account is old enough
    const voucherUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!voucherUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const accountAgeDays = Math.floor(
      (Date.now() - voucherUser.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (accountAgeDays < config.vouchMinAccountAgeDays) {
      return NextResponse.json(
        {
          error: `Your account must be at least ${config.vouchMinAccountAgeDays} days old to vouch for others`,
        },
        { status: 400 }
      )
    }

    // Check if already vouched
    const existingVouch = await prisma.vouch.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: session.user.id,
          toUserId,
        },
      },
    })

    if (existingVouch) {
      return NextResponse.json(
        { error: 'You have already vouched for this user' },
        { status: 400 }
      )
    }

    // Create vouch
    const vouch = await prisma.vouch.create({
      data: {
        fromUserId: session.user.id,
        toUserId,
        relationshipType,
        note,
      },
    })

    return NextResponse.json({
      message: 'Vouch created',
      vouch,
    })
  } catch (error) {
    console.error('Vouch create error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
