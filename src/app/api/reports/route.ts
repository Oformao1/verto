import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { reportSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validationResult = reportSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const { targetType, targetId, category, details } = validationResult.data

    const { prisma } = await import('@/lib/prisma')

    // Verify target exists
    if (targetType === 'USER') {
      const user = await prisma.user.findUnique({ where: { id: targetId } })
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
    } else {
      const listing = await prisma.listing.findUnique({ where: { id: targetId } })
      if (!listing) {
        return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
      }
    }

    const report = await prisma.report.create({
      data: {
        reporterId: session.user.id,
        targetType,
        targetId,
        category,
        details,
      },
    })

    return NextResponse.json({
      message: 'Report submitted',
      report,
    })
  } catch (error) {
    console.error('Report create error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
