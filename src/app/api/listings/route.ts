import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { listingSchema } from '@/lib/validations'
import { config } from '@/lib/config'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const spaceType = searchParams.get('spaceType')
    const minCredits = searchParams.get('minCredits')
    const maxCredits = searchParams.get('maxCredits')
    const minTier = searchParams.get('minTier')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get current user's city for ranking boost
    const session = await getServerSession(authOptions)
    let userCity: string | null = null

    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { city: true },
      })
      userCity = user?.city || null
    }

    // Build where clause
    const where: Record<string, unknown> = {
      isActive: true,
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' }
    }

    if (spaceType) {
      where.spaceType = spaceType
    }

    if (minCredits || maxCredits) {
      const creditsFilter: { gte?: number; lte?: number } = {}
      if (minCredits) creditsFilter.gte = parseInt(minCredits)
      if (maxCredits) creditsFilter.lte = parseInt(maxCredits)
      where.creditsPerNight = creditsFilter
    }

    // Fetch listings with host info
    const listings = await prisma.listing.findMany({
      where,
      include: {
        host: {
          select: {
            id: true,
            name: true,
            photo: true,
            city: true,
            vouchesReceived: true,
          },
        },
        photos: {
          orderBy: { order: 'asc' },
          take: 1,
        },
      },
      skip: offset,
      take: limit,
    })

    // Calculate host tiers and ranking scores
    const tierWindowStart = new Date()
    tierWindowStart.setDate(tierWindowStart.getDate() - config.hostTierWindowDays)

    const listingsWithTiers = await Promise.all(
      listings.map(async (listing) => {
        const completedHostings = await prisma.bookingRequest.count({
          where: {
            hostId: listing.hostId,
            status: 'COMPLETED',
            endDate: { gte: tierWindowStart },
          },
        })

        let tier = 0
        if (completedHostings >= 6) tier = 3
        else if (completedHostings >= 3) tier = 2
        else if (completedHostings >= 1) tier = 1

        // Calculate ranking score
        let score = 0

        // Tier boost (0-30 points)
        score += tier * 10

        // Vouch count boost (up to 20 points)
        score += Math.min(listing.host.vouchesReceived.length * 2, 20)

        // Same city boost (10 points)
        if (userCity && listing.city.toLowerCase().includes(userCity.toLowerCase())) {
          score += 10
        }

        return {
          ...listing,
          hostTier: tier,
          vouchCount: listing.host.vouchesReceived.length,
          rankingScore: score,
        }
      })
    )

    // Filter by minimum tier if specified
    let filteredListings = listingsWithTiers
    if (minTier) {
      filteredListings = listingsWithTiers.filter(
        (l) => l.hostTier >= parseInt(minTier)
      )
    }

    // Sort by ranking score
    filteredListings.sort((a, b) => b.rankingScore - a.rankingScore)

    return NextResponse.json({
      listings: filteredListings,
      total: filteredListings.length,
    })
  } catch (error) {
    console.error('Listings fetch error:', error)
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

    // Extract photos separately (not part of listing schema)
    const { photos, ...listingData } = body

    // Validate input
    const validationResult = listingSchema.safeParse(listingData)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Set default credits based on space type if not provided within bounds
    let creditsPerNight = data.creditsPerNight
    if (!creditsPerNight) {
      creditsPerNight = config.defaultCredits[data.spaceType]
    }
    creditsPerNight = Math.min(
      Math.max(creditsPerNight, config.minCreditsPerNight),
      config.maxCreditsPerNight
    )

    // Create listing with photos in a transaction
    const listing = await prisma.listing.create({
      data: {
        hostId: session.user.id,
        title: data.title,
        city: data.city,
        neighborhood: data.neighborhood || null,
        fullAddress: data.fullAddress,
        spaceType: data.spaceType,
        creditsPerNight,
        maxGuests: data.maxGuests,
        amenities: data.amenities,
        houseRules: data.houseRules || null,
        keyAccessMethod: data.keyAccessMethod,
        keyInstructions: data.keyInstructions || null,
        safetyAck: data.safetyAck,
        // Create photos if provided (base64 data URLs stored directly)
        photos: photos && photos.length > 0 ? {
          create: photos.map((photoUrl: string, index: number) => ({
            url: photoUrl,
            order: index,
          })),
        } : undefined,
      },
      include: {
        photos: true,
      },
    })

    return NextResponse.json({
      message: 'Listing created',
      listing,
    })
  } catch (error) {
    console.error('Listing create error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
