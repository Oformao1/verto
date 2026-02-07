import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// Force Node.js runtime (not Edge) for NextAuth
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Log to confirm env var is visible in production (without exposing the secret)
console.log('AUTH SECRET PRESENT:', Boolean(process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET))

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
