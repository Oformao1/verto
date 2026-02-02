import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { config } from '@/lib/config'

async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  })
  return user?.email === config.adminEmail
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const resource = searchParams.get('resource')

    switch (resource) {
      case 'reports': {
        const reports = await prisma.report.findMany({
          include: {
            reporter: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        })
        return NextResponse.json({ reports })
      }

      case 'users': {
        const users = await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            city: true,
            createdAt: true,
            _count: {
              select: {
                listings: true,
                bookingsAsGuest: true,
                bookingsAsHost: true,
                vouchesReceived: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        })

        // Calculate tiers
        const tierWindowStart = new Date()
        tierWindowStart.setDate(tierWindowStart.getDate() - config.hostTierWindowDays)

        const usersWithTiers = await Promise.all(
          users.map(async (user) => {
            const completedHostings = await prisma.bookingRequest.count({
              where: {
                hostId: user.id,
                status: 'COMPLETED',
                endDate: { gte: tierWindowStart },
              },
            })

            let tier = 0
            if (completedHostings >= 6) tier = 3
            else if (completedHostings >= 3) tier = 2
            else if (completedHostings >= 1) tier = 1

            return { ...user, tier }
          })
        )

        return NextResponse.json({ users: usersWithTiers })
      }

      default:
        return NextResponse.json({ error: 'Invalid resource' }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin GET error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'resolveReport': {
        const { reportId, status } = body

        if (!['RESOLVED', 'DISMISSED'].includes(status)) {
          return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        await prisma.report.update({
          where: { id: reportId },
          data: { status },
        })

        return NextResponse.json({ message: 'Report updated' })
      }

      case 'adjustCredits': {
        const { userId, amount, note } = body

        if (!userId || typeof amount !== 'number' || !note) {
          return NextResponse.json(
            { error: 'userId, amount, and note are required' },
            { status: 400 }
          )
        }

        const { adminAdjustCredits } = await import('@/lib/credits')
        await adminAdjustCredits(userId, amount, note)

        return NextResponse.json({ message: 'Credits adjusted' })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin POST error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
