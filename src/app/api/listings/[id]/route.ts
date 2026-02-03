import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { prisma } = await import('@/lib/prisma')
    const { getUserHostTier } = await import('@/lib/tiers')

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            photo: true,
            bio: true,
            city: true,
            createdAt: true,
            vouchesReceived: {
              include: {
                fromUser: {
                  select: { name: true, photo: true },
                },
              },
            },
            reviewsReceived: {
              include: {
                reviewer: {
                  select: { name: true, photo: true },
                },
              },
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        },
        photos: {
          orderBy: { order: 'asc' },
        },
        availabilityBlocks: true,
      },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Get host tier
    const hostTier = await getUserHostTier(listing.hostId)

    // Check if current user is the host or has a confirmed booking
    const session = await getServerSession(authOptions)
    let showFullAddress = false
    let showKeyInstructions = false

    if (session?.user?.id === listing.hostId) {
      showFullAddress = true
      showKeyInstructions = true
    } else if (session?.user?.id) {
      const confirmedBooking = await prisma.bookingRequest.findFirst({
        where: {
          listingId: id,
          guestId: session.user.id,
          status: 'CONFIRMED',
        },
      })
      if (confirmedBooking) {
        showFullAddress = true
        showKeyInstructions = true
      }
    }

    return NextResponse.json({
      ...listing,
      fullAddress: showFullAddress ? listing.fullAddress : null,
      keyInstructions: showKeyInstructions ? listing.keyInstructions : null,
      hostTier,
      vouchCount: listing.host.vouchesReceived.length,
    })
  } catch (error) {
    console.error('Listing fetch error:', error)
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

    const { prisma } = await import('@/lib/prisma')

    const listing = await prisma.listing.findUnique({
      where: { id },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (listing.hostId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    const updatedListing = await prisma.listing.update({
      where: { id },
      data: {
        title: body.title,
        city: body.city,
        neighborhood: body.neighborhood,
        fullAddress: body.fullAddress,
        spaceType: body.spaceType,
        creditsPerNight: body.creditsPerNight,
        maxGuests: body.maxGuests,
        amenities: body.amenities,
        houseRules: body.houseRules,
        keyAccessMethod: body.keyAccessMethod,
        keyInstructions: body.keyInstructions,
        isActive: body.isActive,
      },
    })

    return NextResponse.json({
      message: 'Listing updated',
      listing: updatedListing,
    })
  } catch (error) {
    console.error('Listing update error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')

    const listing = await prisma.listing.findUnique({
      where: { id },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (listing.hostId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check for active bookings
    const activeBookings = await prisma.bookingRequest.count({
      where: {
        listingId: id,
        status: { in: ['REQUESTED', 'CONFIRMED'] },
      },
    })

    if (activeBookings > 0) {
      return NextResponse.json(
        { error: 'Cannot delete listing with active bookings' },
        { status: 400 }
      )
    }

    await prisma.listing.delete({ where: { id } })

    return NextResponse.json({ message: 'Listing deleted' })
  } catch (error) {
    console.error('Listing delete error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
