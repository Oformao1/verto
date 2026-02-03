import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { profileSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        photo: true,
        bio: true,
        city: true,
        workIndustry: true,
        socialsLink: true,
        modeInterest: true,
        emailVerified: true,
        phoneVerified: true,
        referralCode: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validationResult = profileSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const { name, bio, city, workIndustry, socialsLink, modeInterest } = validationResult.data

    const { prisma } = await import('@/lib/prisma')

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        bio: bio || null,
        city: city || null,
        workIndustry: workIndustry || null,
        socialsLink: socialsLink || null,
        modeInterest,
      },
    })

    // Check and complete referral bonus if applicable
    await checkAndCompleteReferral(session.user.id)

    return NextResponse.json({
      message: 'Profile updated',
      user: updatedUser,
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

async function checkAndCompleteReferral(userId: string) {
  const { prisma } = await import('@/lib/prisma')

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      referredBy: true,
    },
  })

  if (!user || !user.referredBy || user.referredBy.status !== 'PENDING') {
    return
  }

  // Check if user has completed requirements: photo + bio AND (phone or email verified)
  const hasProfile = user.photo && user.bio
  const hasVerification = user.phoneVerified || user.emailVerified

  if (hasProfile && hasVerification) {
    const { config } = await import('@/lib/config')
    const { awardReferralBonus } = await import('@/lib/credits')

    // Award bonus to both parties
    await awardReferralBonus(
      user.referredBy.referrerId,
      userId,
      config.referralBonusCredits
    )

    // Mark referral as completed
    await prisma.referral.update({
      where: { id: user.referredBy.id },
      data: {
        status: 'COMPLETED',
        awardedAt: new Date(),
      },
    })
  }
}
