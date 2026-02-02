import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signUpSchema } from '@/lib/validations'
import { generateDeviceFingerprint } from '@/lib/utils'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password, referralCode } = body

    // Validate input
    const validationResult = signUpSchema.safeParse({ name, email, password })
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await hash(password, 12)

    // Get device fingerprint for anti-abuse
    const headersList = await headers()
    const userAgent = headersList.get('user-agent')
    const forwarded = headersList.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0] || null
    const deviceFingerprint = generateDeviceFingerprint(userAgent, ip)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        deviceFingerprint,
      },
    })

    // Handle referral if provided
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode },
      })

      if (referrer && referrer.id !== user.id) {
        // Check for self-referral by device fingerprint
        const isSameDevice = referrer.deviceFingerprint === deviceFingerprint

        if (!isSameDevice) {
          await prisma.referral.create({
            data: {
              referrerId: referrer.id,
              referredId: user.id,
              status: 'PENDING',
            },
          })
        }
      }
    }

    // Give initial credits
    await prisma.creditLedgerEntry.create({
      data: {
        userId: user.id,
        amount: 5, // Initial signup bonus
        type: 'INITIAL_CREDIT',
        note: 'Welcome to Verto!',
      },
    })

    return NextResponse.json({
      message: 'Account created successfully',
      userId: user.id,
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
