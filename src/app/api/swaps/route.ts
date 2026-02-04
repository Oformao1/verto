import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { swapRequestSchema } from '@/lib/validations'
import { isValidMVPCity } from '@/lib/cities'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const destinationCity = searchParams.get('destinationCity')
    const originCity = searchParams.get('originCity')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Validate city filters if provided
    if (destinationCity && !isValidMVPCity(destinationCity)) {
      return NextResponse.json(
        { error: 'Invalid destination city' },
        { status: 400 }
      )
    }
    if (originCity && !isValidMVPCity(originCity)) {
      return NextResponse.json(
        { error: 'Invalid origin city' },
        { status: 400 }
      )
    }

    const { prisma } = await import('@/lib/prisma')

    // Build where clause
    const where: Record<string, unknown> = {
      isActive: true,
    }

    if (destinationCity) {
      where.destinationCity = destinationCity
    }

    if (originCity) {
      where.originCity = originCity
    }

    const swaps = await prisma.swapRequest.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            photo: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    })

    const total = await prisma.swapRequest.count({ where })

    return NextResponse.json({
      swaps,
      total,
    })
  } catch (error) {
    console.error('Swaps fetch error:', error)
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
    const validationResult = swapRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const { originCity, destinationCity, startDate, endDate, guests, notes } = validationResult.data

    // Double-check city validation (belt and suspenders)
    if (!isValidMVPCity(originCity) || !isValidMVPCity(destinationCity)) {
      return NextResponse.json(
        { error: 'Invalid city selection. Please choose from the available cities.' },
        { status: 400 }
      )
    }

    const { prisma } = await import('@/lib/prisma')

    const swapRequest = await prisma.swapRequest.create({
      data: {
        createdByUserId: session.user.id,
        originCity,
        destinationCity,
        startDate,
        endDate,
        guests,
        notes: notes || null,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            photo: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: 'Swap request created',
      swapRequest,
    })
  } catch (error) {
    console.error('Swap create error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
