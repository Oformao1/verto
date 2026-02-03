import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { getUserCreditBalance, getCreditHistory } = await import('@/lib/credits')

    const [balance, history] = await Promise.all([
      getUserCreditBalance(session.user.id),
      getCreditHistory(session.user.id),
    ])

    return NextResponse.json({ balance, history })
  } catch (error) {
    console.error('Credits fetch error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
