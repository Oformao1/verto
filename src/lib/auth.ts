import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

// Demo user for testing without database
const DEMO_USER = {
  id: 'demo-user-id',
  email: 'demo@verto.app',
  name: 'Demo User',
  image: null,
}
const DEMO_PASSWORD = 'demo123'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Check for demo user first (works without database)
        if (
          credentials.email.toLowerCase() === DEMO_USER.email &&
          credentials.password === DEMO_PASSWORD
        ) {
          return DEMO_USER
        }

        // Try database authentication (dynamic import to avoid breaking when DB unavailable)
        try {
          const { prisma } = await import('./prisma')
          const { compare } = await import('bcryptjs')

          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() },
          })

          if (!user) {
            return null
          }

          const isPasswordValid = await compare(credentials.password, user.passwordHash)

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.photo,
          }
        } catch {
          // Database not available, only demo login works
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    newUser: '/onboarding',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
}
