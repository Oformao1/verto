import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { prisma } = await import('@/lib/prisma')

    const swapRequest = await prisma.swapRequest.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            photo: true,
            bio: true,
            city: true,
            workIndustry: true,
            vouchesReceived: {
              select: {
                id: true,
                relationshipType: true,
                note: true,
                fromUser: {
                  select: {
                    id: true,
                    name: true,
                    photo: true,
                  },
                },
              },
            },
            listings: {
              where: { isActive: true },
              take: 1,
              select: {
                id: true,
                title: true,
                city: true,
                neighborhood: true,
                spaceType: true,
                creditsPerNight: true,
                maxGuests: true,
                photos: {
                  take: 1,
                  orderBy: { order: 'asc' },
                  select: { url: true },
                },
              },
            },
          },
        },
      },
    })

    if (!swapRequest) {
      return NextResponse.json({ error: 'Swap request not found' }, { status: 404 })
    }

    return NextResponse.json({ swapRequest })
  } catch (error) {
    console.error('Swap fetch error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
