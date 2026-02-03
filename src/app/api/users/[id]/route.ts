import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { prisma } = await import('@/lib/prisma')
    const { getUserHostTier } = await import('@/lib/tiers')

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        photo: true,
        bio: true,
        city: true,
        workIndustry: true,
        socialsLink: true,
        createdAt: true,
        vouchesReceived: {
          include: {
            fromUser: {
              select: { id: true, name: true, photo: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        reviewsReceived: {
          include: {
            reviewer: {
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
        },
        listings: {
          where: { isActive: true },
          include: {
            photos: { take: 1 },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const hostTier = await getUserHostTier(user.id)

    return NextResponse.json({
      ...user,
      hostTier,
      vouchCount: user.vouchesReceived.length,
    })
  } catch (error) {
    console.error('User fetch error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
