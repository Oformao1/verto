import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserCreditBalance } from '@/lib/credits'
import { getUserHostTier } from '@/lib/tiers'
import { getTierBadge } from '@/lib/tiers'
import { Navbar } from '@/components/layout/Navbar'
import { Card, Badge, Avatar } from '@/components/ui'
import { Search, Home, Users, MapPin, ArrowRight, Coins } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      vouchesReceived: true,
    },
  })

  if (!user) {
    redirect('/login')
  }

  // Check if onboarding is needed
  if (!user.name || !user.bio) {
    redirect('/onboarding')
  }

  const [creditBalance, hostTier, upcomingTrips, hostingCommitments] = await Promise.all([
    getUserCreditBalance(user.id),
    getUserHostTier(user.id),
    prisma.bookingRequest.findMany({
      where: {
        guestId: user.id,
        status: { in: ['REQUESTED', 'CONFIRMED'] },
        startDate: { gte: new Date() },
      },
      include: {
        listing: {
          include: { host: true },
        },
      },
      orderBy: { startDate: 'asc' },
      take: 5,
    }),
    prisma.bookingRequest.findMany({
      where: {
        hostId: user.id,
        status: { in: ['REQUESTED', 'CONFIRMED'] },
        startDate: { gte: new Date() },
      },
      include: {
        listing: true,
        guest: true,
      },
      orderBy: { startDate: 'asc' },
      take: 5,
    }),
  ])

  const tierBadge = getTierBadge(hostTier)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user.name?.split(' ')[0]}
          </h1>
          <p className="text-gray-600 mt-1">
            Here&apos;s what&apos;s happening with your account
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Credit Balance</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{creditBalance}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <Coins className="w-6 h-6 text-primary" />
              </div>
            </div>
            <Link
              href="/credits"
              className="mt-4 text-sm text-primary hover:text-primary-600 inline-flex items-center gap-1"
            >
              View history
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Host Tier</p>
                <div className="mt-2">
                  <Badge className={tierBadge.color}>{tierBadge.label}</Badge>
                </div>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <Home className="w-6 h-6 text-primary" />
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Tier {hostTier} based on recent hostings
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Vouches</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {user.vouchesReceived.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
            <Link
              href="/profile#vouches"
              className="mt-4 text-sm text-primary hover:text-primary-600 inline-flex items-center gap-1"
            >
              View vouches
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Card>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link href="/explore">
            <Card hover className="p-6 flex items-center gap-4 cursor-pointer">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Find a stay</h3>
                <p className="text-sm text-gray-500">Browse available listings</p>
              </div>
            </Card>
          </Link>

          <Link href="/listings/new">
            <Card hover className="p-6 flex items-center gap-4 cursor-pointer">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">List your space</h3>
                <p className="text-sm text-gray-500">Start hosting guests</p>
              </div>
            </Card>
          </Link>

          <Link href="/vouches/request">
            <Card hover className="p-6 flex items-center gap-4 cursor-pointer">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Request a vouch</h3>
                <p className="text-sm text-gray-500">Build your trust score</p>
              </div>
            </Card>
          </Link>
        </div>

        {/* Trips and hosting */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming trips */}
          <Card>
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Upcoming trips</h2>
                <Link
                  href="/trips"
                  className="text-sm text-primary hover:text-primary-600"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="p-6">
              {upcomingTrips.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No upcoming trips</p>
                  <Link
                    href="/explore"
                    className="mt-3 inline-flex items-center gap-1 text-primary hover:text-primary-600 text-sm"
                  >
                    Find a stay
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingTrips.map((trip) => (
                    <Link
                      key={trip.id}
                      href={`/trips/${trip.id}`}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Avatar
                        src={trip.listing.host.photo}
                        name={trip.listing.host.name}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {trip.listing.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                        </p>
                      </div>
                      <Badge variant={trip.status === 'CONFIRMED' ? 'success' : 'warning'}>
                        {trip.status}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Hosting commitments */}
          <Card>
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Hosting</h2>
                <Link
                  href="/trips?tab=hosting"
                  className="text-sm text-primary hover:text-primary-600"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="p-6">
              {hostingCommitments.length === 0 ? (
                <div className="text-center py-8">
                  <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No hosting requests</p>
                  <Link
                    href="/listings/new"
                    className="mt-3 inline-flex items-center gap-1 text-primary hover:text-primary-600 text-sm"
                  >
                    List your space
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {hostingCommitments.map((booking) => (
                    <Link
                      key={booking.id}
                      href={`/trips/${booking.id}`}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Avatar
                        src={booking.guest.photo}
                        name={booking.guest.name}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {booking.guest.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                        </p>
                      </div>
                      <Badge variant={booking.status === 'CONFIRMED' ? 'success' : 'warning'}>
                        {booking.status}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
