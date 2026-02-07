'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { MobileLayout } from '@/components/layout/MobileLayout'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { Button, Card, Avatar, ModalSheet, Pill } from '@/components/ui'
import {
  ArrowRight,
  Calendar,
  Users,
  Home,
  MapPin,
  Briefcase,
  Shield,
  CheckCircle2,
  ChevronRight,
  MessageSquare
} from 'lucide-react'
import { format } from 'date-fns'

interface SwapDetail {
  id: string
  originCity: string
  destinationCity: string
  startDate: string
  endDate: string
  guests: number
  notes: string | null
  createdAt: string
  createdBy: {
    id: string
    name: string | null
    photo: string | null
    bio: string | null
    city: string | null
    workIndustry: string | null
    vouchesReceived: Array<{
      id: string
      relationshipType: string
      note: string | null
      fromUser: {
        id: string
        name: string | null
        photo: string | null
      }
    }>
    listings: Array<{
      id: string
      title: string
      city: string
      neighborhood: string | null
      spaceType: string
      creditsPerNight: number
      maxGuests: number
      photos: Array<{ url: string }>
    }>
  }
}

export default function SwapDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [swap, setSwap] = useState<SwapDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showVouches, setShowVouches] = useState(false)

  useEffect(() => {
    fetchSwap()
  }, [params.id])

  const fetchSwap = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/swaps/${params.id}`)
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to fetch swap')
      setSwap(data.swapRequest)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestSwap = () => {
    if (status !== 'authenticated') {
      router.push(`/login?callbackUrl=/swaps/${params.id}`)
      return
    }
    // TODO: Implement swap request flow
    router.push(`/messages?swap=${params.id}`)
  }

  if (loading) {
    return (
      <MobileLayout
        header={<MobileHeader showBack backHref="/swaps" />}
        showBottomNav={false}
      >
        <div className="px-4 py-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-32 mb-3" />
                <div className="h-3 bg-gray-200 rounded w-48 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-40" />
              </div>
            </Card>
          ))}
        </div>
      </MobileLayout>
    )
  }

  if (error || !swap) {
    return (
      <MobileLayout
        header={<MobileHeader showBack backHref="/swaps" />}
        showBottomNav={false}
      >
        <div className="px-4 py-8">
          <Card className="p-8 text-center">
            <p className="text-red-600 mb-4">{error || 'Swap not found'}</p>
            <Button onClick={() => router.push('/swaps')}>Back to swaps</Button>
          </Card>
        </div>
      </MobileLayout>
    )
  }

  const vouchCount = swap.createdBy.vouchesReceived.length
  const listing = swap.createdBy.listings[0]
  const isOwnSwap = session?.user?.id === swap.createdBy.id

  return (
    <MobileLayout
      header={<MobileHeader showBack backHref="/swaps" title="Swap Details" />}
      showBottomNav={false}
    >
      <div className="px-4 py-4 space-y-4 pb-28">
        {/* Person Card */}
        <Card className="p-4">
          <div className="flex items-start gap-4">
            <Avatar
              src={swap.createdBy.photo}
              name={swap.createdBy.name}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900">
                {swap.createdBy.name || 'Anonymous'}
              </h2>
              <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-1">
                <span>{swap.originCity.split(' ')[0]}</span>
                <ArrowRight className="w-3.5 h-3.5 text-primary" />
                <span className="text-primary font-medium">
                  {swap.destinationCity.split(' ')[0]}
                </span>
              </div>
              {swap.createdBy.city && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Based in {swap.createdBy.city}</span>
                </div>
              )}
              {swap.createdBy.workIndustry && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>{swap.createdBy.workIndustry}</span>
                </div>
              )}
            </div>
          </div>

          {swap.createdBy.bio && (
            <p className="text-gray-600 text-sm mt-4 leading-relaxed">
              {swap.createdBy.bio}
            </p>
          )}

          {/* Vouches pill */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => setShowVouches(true)}
              className="flex items-center gap-2 text-sm"
            >
              <Pill variant="success" size="sm">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {vouchCount} {vouchCount === 1 ? 'vouch' : 'vouches'}
              </Pill>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </Card>

        {/* Trip Details Card */}
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Trip Details</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">
                {format(new Date(swap.startDate), 'MMM d, yyyy')} – {format(new Date(swap.endDate), 'MMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">
                {swap.guests} {swap.guests === 1 ? 'guest' : 'guests'}
              </span>
            </div>
          </div>

          {swap.notes && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600 leading-relaxed">
                &ldquo;{swap.notes}&rdquo;
              </p>
            </div>
          )}
        </Card>

        {/* Their Place Card */}
        {listing ? (
          <Card
            className="overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
            onClick={() => router.push(`/listings/${listing.id}`)}
          >
            {listing.photos[0]?.url && (
              <div className="aspect-video bg-gray-100 relative">
                <img
                  src={listing.photos[0].url}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{listing.title}</h3>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <Home className="w-4 h-4" />
                <span>{listing.spaceType === 'ENTIRE_PLACE' ? 'Entire place' : 'Private room'}</span>
                <span className="text-gray-300">|</span>
                <span>Up to {listing.maxGuests} guests</span>
              </div>
              <div className="flex items-center gap-2">
                <Pill size="sm">
                  {listing.creditsPerNight} {listing.creditsPerNight === 1 ? 'credit' : 'credits'}/night
                </Pill>
                {listing.neighborhood && (
                  <Pill size="sm">{listing.neighborhood}</Pill>
                )}
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-4">
            <div className="flex items-center gap-3 text-gray-500">
              <Home className="w-5 h-5" />
              <div>
                <p className="font-medium text-gray-900">No listing yet</p>
                <p className="text-sm">
                  {swap.createdBy.name?.split(' ')[0] || 'This user'} hasn&apos;t added a listing
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Trust Card */}
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Trust & Safety</h3>
              <p className="text-sm text-gray-500">
                Community-verified members
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">
                {swap.createdBy.name?.split(' ')[0] || 'They'} has
              </span>
              <span className="font-semibold text-gray-900">
                {vouchCount} {vouchCount === 1 ? 'vouch' : 'vouches'}
              </span>
            </div>
            {session?.user && !isOwnSwap && (
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">You have</span>
                <span className="font-semibold text-gray-900">
                  – vouches
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setShowVouches(true)}
            >
              View vouches
            </Button>
            {session?.user && !isOwnSwap && (
              <Button variant="outline" size="sm" className="flex-1">
                Request a vouch
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Sticky bottom CTA */}
      {!isOwnSwap && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                if (status !== 'authenticated') {
                  router.push(`/login?callbackUrl=/swaps/${params.id}`)
                  return
                }
                router.push(`/messages?user=${swap.createdBy.id}`)
              }}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Message
            </Button>
            <Button className="flex-1" onClick={handleRequestSwap}>
              Request swap
            </Button>
          </div>
        </div>
      )}

      {/* Vouches Modal */}
      <ModalSheet
        isOpen={showVouches}
        onClose={() => setShowVouches(false)}
        title={`Vouches for ${swap.createdBy.name?.split(' ')[0] || 'this user'}`}
      >
        <div className="p-4 space-y-4">
          {vouchCount === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No vouches yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Be the first to vouch for {swap.createdBy.name?.split(' ')[0]}
              </p>
            </div>
          ) : (
            swap.createdBy.vouchesReceived.map((vouch) => (
              <Card key={vouch.id} className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar
                    src={vouch.fromUser.photo}
                    name={vouch.fromUser.name}
                    size="md"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {vouch.fromUser.name || 'Anonymous'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {vouch.relationshipType.charAt(0) + vouch.relationshipType.slice(1).toLowerCase()}
                    </p>
                    {vouch.note && (
                      <p className="text-sm text-gray-600 mt-2">
                        &ldquo;{vouch.note}&rdquo;
                      </p>
                    )}
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                </div>
              </Card>
            ))
          )}
        </div>
      </ModalSheet>
    </MobileLayout>
  )
}
