'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Card, Badge, Avatar, Spinner } from '@/components/ui'
import { MapPin, Calendar, ArrowRight } from 'lucide-react'
import { formatDateRange } from '@/lib/utils'

interface Booking {
  id: string
  startDate: string
  endDate: string
  status: string
  creditsTotal: number
  listing: {
    id: string
    title: string
    city: string
    photos: { url: string }[]
  }
  guest: {
    id: string
    name: string
    photo: string | null
  }
  host: {
    id: string
    name: string
    photo: string | null
  }
}

function TripsContent() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || 'trips'

  const [trips, setTrips] = useState<Booking[]>([])
  const [hosting, setHosting] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login?callbackUrl=/trips')
    }
  }, [authStatus, router])

  useEffect(() => {
    async function fetchData() {
      if (authStatus !== 'authenticated') return

      try {
        const [tripsRes, hostingRes] = await Promise.all([
          fetch('/api/bookings?role=guest'),
          fetch('/api/bookings?role=host'),
        ])

        const [tripsData, hostingData] = await Promise.all([
          tripsRes.json(),
          hostingRes.json(),
        ])

        setTrips(tripsData.bookings || [])
        setHosting(hostingData.bookings || [])
      } catch (error) {
        console.error('Failed to fetch bookings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [authStatus])

  if (authStatus === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  const activeTrips = trips.filter((t) => ['REQUESTED', 'CONFIRMED'].includes(t.status))
  const pastTrips = trips.filter((t) => ['COMPLETED', 'CANCELLED', 'DECLINED'].includes(t.status))
  const activeHosting = hosting.filter((h) => ['REQUESTED', 'CONFIRMED'].includes(h.status))
  const pastHosting = hosting.filter((h) =>
    ['COMPLETED', 'CANCELLED', 'DECLINED'].includes(h.status)
  )

  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Your stays</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-200">
        <button
          onClick={() => router.push('/trips')}
          className={`pb-4 px-1 font-medium transition-colors ${
            tab === 'trips'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          My stays ({trips.length})
        </button>
        <button
          onClick={() => router.push('/trips?tab=hosting')}
          className={`pb-4 px-1 font-medium transition-colors ${
            tab === 'hosting'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Hosting ({hosting.length})
        </button>
      </div>

      {tab === 'trips' ? (
        <div className="space-y-8">
          {activeTrips.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Active stays</h2>
              <div className="space-y-4">
                {activeTrips.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} isHost={false} />
                ))}
              </div>
            </section>
          )}

          {pastTrips.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Past stays</h2>
              <div className="space-y-4">
                {pastTrips.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} isHost={false} />
                ))}
              </div>
            </section>
          )}

          {trips.length === 0 && (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No stays yet</h3>
              <p className="text-gray-500 mb-4">
                Start exploring and book your first stay!
              </p>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 text-primary hover:text-primary-600"
              >
                Explore listings
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {activeHosting.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Active</h2>
              <div className="space-y-4">
                {activeHosting.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} isHost={true} />
                ))}
              </div>
            </section>
          )}

          {pastHosting.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Past</h2>
              <div className="space-y-4">
                {pastHosting.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} isHost={true} />
                ))}
              </div>
            </section>
          )}

          {hosting.length === 0 && (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hosting requests yet
              </h3>
              <p className="text-gray-500 mb-4">
                List your space to start receiving booking requests.
              </p>
              <Link
                href="/listings/new"
                className="inline-flex items-center gap-2 text-primary hover:text-primary-600"
              >
                List your space
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  )
}

function BookingCard({ booking, isHost }: { booking: Booking; isHost: boolean }) {
  const statusColors: Record<string, string> = {
    REQUESTED: 'warning',
    CONFIRMED: 'success',
    COMPLETED: 'default',
    CANCELLED: 'error',
    DECLINED: 'error',
  }

  const otherUser = isHost ? booking.guest : booking.host

  return (
    <Link href={`/trips/${booking.id}`}>
      <Card hover className="p-4">
        <div className="flex gap-4">
          <Avatar src={otherUser.photo} name={otherUser.name} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {booking.listing.title}
              </h3>
              <Badge variant={statusColors[booking.status] as 'default' | 'primary' | 'success' | 'warning' | 'error'}>
                {booking.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mb-2">
              {isHost ? `Guest: ${otherUser.name}` : `Host: ${otherUser.name}`}
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDateRange(booking.startDate, booking.endDate)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {booking.listing.city}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-primary">{booking.creditsTotal} credits</p>
          </div>
        </div>
      </Card>
    </Link>
  )
}

export default function TripsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>}>
          <TripsContent />
        </Suspense>
      </main>
    </div>
  )
}
