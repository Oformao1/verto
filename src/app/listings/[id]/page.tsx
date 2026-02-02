'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Button, Card, Badge, Avatar, Input, Textarea, Select, Spinner, Modal } from '@/components/ui'
import { MapPin, Users, Home, Coins, Shield, Star, Check, Key, Calendar, Flag } from 'lucide-react'
import { getTierBadge } from '@/lib/tiers'
import { formatDate, calculateNights } from '@/lib/utils'

interface ListingDetails {
  id: string
  title: string
  city: string
  neighborhood: string | null
  fullAddress: string | null
  spaceType: 'ROOM' | 'ENTIRE_PLACE'
  creditsPerNight: number
  maxGuests: number
  amenities: string[]
  houseRules: string | null
  keyAccessMethod: string
  keyInstructions: string | null
  photos: { id: string; url: string }[]
  host: {
    id: string
    name: string
    photo: string | null
    bio: string | null
    city: string | null
    createdAt: string
    vouchesReceived: {
      fromUser: { name: string; photo: string | null }
      note: string | null
      relationshipType: string
    }[]
    reviewsReceived: {
      rating: number
      text: string | null
      reviewer: { name: string; photo: string | null }
    }[]
  }
  hostTier: number
  vouchCount: number
  availabilityBlocks: { startDate: string; endDate: string }[]
}

const amenityLabels: Record<string, string> = {
  wifi: 'WiFi',
  kitchen: 'Kitchen',
  workspace: 'Dedicated workspace',
  washer: 'Washer',
  dryer: 'Dryer',
  parking: 'Free parking',
  ac: 'Air conditioning',
  heating: 'Heating',
  tv: 'TV',
  pool: 'Pool',
  gym: 'Gym',
  pets: 'Pet friendly',
}

const keyMethodLabels: Record<string, string> = {
  SMART_LOCK: 'Smart lock / keypad',
  LOCKBOX: 'Lockbox',
  IN_PERSON: 'In-person handoff',
  DOORMAN: 'Doorman / building staff',
}

export default function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()

  const [listing, setListing] = useState<ListingDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Booking form
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [purpose, setPurpose] = useState('WORK')
  const [message, setMessage] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState('')

  // Report modal
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportCategory, setReportCategory] = useState('')
  const [reportDetails, setReportDetails] = useState('')
  const [reportLoading, setReportLoading] = useState(false)

  useEffect(() => {
    async function fetchListing() {
      try {
        const res = await fetch(`/api/listings/${id}`)
        if (!res.ok) {
          setError('Listing not found')
          return
        }
        const data = await res.json()
        setListing(data)
      } catch {
        setError('Failed to load listing')
      } finally {
        setLoading(false)
      }
    }
    fetchListing()
  }, [id])

  const handleBookingRequest = async () => {
    if (!session) {
      router.push(`/login?callbackUrl=/listings/${id}`)
      return
    }

    setBookingError('')
    setBookingLoading(true)

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: id,
          startDate,
          endDate,
          purpose,
          guestMessage: message,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setBookingError(data.error || 'Failed to send request')
        return
      }

      router.push(`/trips/${data.booking.id}`)
    } catch {
      setBookingError('Something went wrong')
    } finally {
      setBookingLoading(false)
    }
  }

  const handleReport = async () => {
    if (!session) return

    setReportLoading(true)
    try {
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: 'LISTING',
          targetId: id,
          category: reportCategory,
          details: reportDetails,
        }),
      })
      setShowReportModal(false)
      setReportCategory('')
      setReportDetails('')
    } catch {
      // Silent fail
    } finally {
      setReportLoading(false)
    }
  }

  const nights = startDate && endDate ? calculateNights(startDate, endDate) : 0
  const totalCredits = nights * (listing?.creditsPerNight || 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Listing not found</h1>
            <Link href="/explore" className="text-primary hover:text-primary-600">
              Back to explore
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const tierBadge = getTierBadge(listing.hostTier)
  const isOwner = session?.user?.id === listing.host.id

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Photos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
              {listing.photos[0] ? (
                <Image
                  src={listing.photos[0].url}
                  alt={listing.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Home className="w-20 h-20 text-gray-300" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {listing.photos.slice(1, 5).map((photo, idx) => (
                <div
                  key={photo.id}
                  className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100"
                >
                  <Image src={photo.url} alt="" fill className="object-cover" />
                  {idx === 3 && listing.photos.length > 5 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-semibold">
                        +{listing.photos.length - 5} more
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Title and location */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge className={tierBadge.color}>{tierBadge.label}</Badge>
                  <span className="text-gray-500 capitalize">
                    {listing.spaceType === 'ENTIRE_PLACE' ? 'Entire place' : 'Private room'}
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{listing.title}</h1>
                <div className="flex items-center gap-4 text-gray-600">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {listing.city}
                    {listing.neighborhood && `, ${listing.neighborhood}`}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    Up to {listing.maxGuests} guests
                  </span>
                </div>
              </div>

              {/* Host info */}
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <Link href={`/users/${listing.host.id}`}>
                    <Avatar src={listing.host.photo} name={listing.host.name} size="xl" />
                  </Link>
                  <div className="flex-1">
                    <Link
                      href={`/users/${listing.host.id}`}
                      className="font-semibold text-gray-900 hover:text-primary"
                    >
                      Hosted by {listing.host.name}
                    </Link>
                    <p className="text-sm text-gray-500">
                      Member since {formatDate(listing.host.createdAt)}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-sm">
                        <Shield className="w-4 h-4 text-primary" />
                        {listing.vouchCount} vouches
                      </span>
                      {listing.host.reviewsReceived.length > 0 && (
                        <span className="flex items-center gap-1 text-sm">
                          <Star className="w-4 h-4 text-yellow-500" />
                          {(
                            listing.host.reviewsReceived.reduce((a, r) => a + r.rating, 0) /
                            listing.host.reviewsReceived.length
                          ).toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {listing.host.bio && (
                  <p className="mt-4 text-gray-600">{listing.host.bio}</p>
                )}
              </Card>

              {/* Amenities */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 gap-3">
                  {listing.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2 text-gray-600">
                      <Check className="w-4 h-4 text-primary" />
                      {amenityLabels[amenity] || amenity}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Key access */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Key access</h2>
                <div className="flex items-center gap-2 text-gray-600">
                  <Key className="w-5 h-5 text-primary" />
                  {keyMethodLabels[listing.keyAccessMethod]}
                </div>
                {listing.keyInstructions && (
                  <div className="mt-4 p-4 bg-primary-50 rounded-lg">
                    <p className="text-sm font-medium text-primary-700 mb-1">
                      Access instructions
                    </p>
                    <p className="text-sm text-primary-600">{listing.keyInstructions}</p>
                  </div>
                )}
              </Card>

              {/* House rules */}
              {listing.houseRules && (
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">House rules</h2>
                  <p className="text-gray-600 whitespace-pre-wrap">{listing.houseRules}</p>
                </Card>
              )}

              {/* Reviews */}
              {listing.host.reviewsReceived.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Reviews ({listing.host.reviewsReceived.length})
                  </h2>
                  <div className="space-y-4">
                    {listing.host.reviewsReceived.map((review, idx) => (
                      <div key={idx} className="pb-4 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar
                            src={review.reviewer.photo}
                            name={review.reviewer.name}
                            size="sm"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{review.reviewer.name}</p>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? 'text-yellow-500 fill-yellow-500'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        {review.text && <p className="text-gray-600">{review.text}</p>}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Booking sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="p-6">
                  <div className="flex items-baseline justify-between mb-6">
                    <div>
                      <span className="text-3xl font-bold text-gray-900">
                        {listing.creditsPerNight}
                      </span>
                      <span className="text-gray-500 ml-1">credits/night</span>
                    </div>
                    <Coins className="w-6 h-6 text-primary" />
                  </div>

                  {isOwner ? (
                    <div className="text-center py-4">
                      <p className="text-gray-500 mb-4">This is your listing</p>
                      <Link href={`/listings/${id}/edit`}>
                        <Button variant="outline" className="w-full">
                          Edit listing
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4 mb-6">
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Check-in"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                          />
                          <Input
                            label="Check-out"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate || new Date().toISOString().split('T')[0]}
                          />
                        </div>

                        {nights > 0 && (
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-gray-600">
                                {listing.creditsPerNight} credits x {nights} nights
                              </span>
                              <span className="font-medium">{totalCredits} credits</span>
                            </div>
                            <div className="flex justify-between font-semibold">
                              <span>Total</span>
                              <span className="text-primary">{totalCredits} credits</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <Button
                        className="w-full"
                        onClick={() =>
                          status === 'authenticated'
                            ? setShowBookingModal(true)
                            : router.push(`/login?callbackUrl=/listings/${id}`)
                        }
                        disabled={!startDate || !endDate || nights < 1}
                      >
                        {status === 'authenticated' ? 'Request to book' : 'Sign in to book'}
                      </Button>

                      <p className="text-center text-sm text-gray-500 mt-4">
                        You won&apos;t be charged until the host confirms
                      </p>
                    </>
                  )}
                </Card>

                {/* Report button */}
                {!isOwner && status === 'authenticated' && (
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="mt-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                  >
                    <Flag className="w-4 h-4" />
                    Report this listing
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Booking modal */}
      <Modal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        title="Complete your booking request"
      >
        <div className="space-y-4">
          {bookingError && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {bookingError}
            </div>
          )}

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">
                  {formatDate(startDate)} - {formatDate(endDate)}
                </p>
                <p className="text-sm text-gray-500">{nights} nights</p>
              </div>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-primary">{totalCredits} credits</span>
            </div>
          </div>

          <Select
            label="Purpose of stay"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            options={[
              { value: 'WORK', label: 'Work / Remote work' },
              { value: 'TRAVEL', label: 'Travel / Vacation' },
              { value: 'OTHER', label: 'Other' },
            ]}
          />

          <Textarea
            label="Message to host (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Introduce yourself and share why you're interested in this stay..."
            rows={4}
          />

          <Button
            className="w-full"
            onClick={handleBookingRequest}
            loading={bookingLoading}
          >
            Send booking request
          </Button>
        </div>
      </Modal>

      {/* Report modal */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Report this listing"
      >
        <div className="space-y-4">
          <Select
            label="Reason for report"
            value={reportCategory}
            onChange={(e) => setReportCategory(e.target.value)}
            options={[
              { value: '', label: 'Select a reason' },
              { value: 'inaccurate', label: 'Inaccurate or misleading' },
              { value: 'scam', label: 'Suspected scam' },
              { value: 'offensive', label: 'Offensive content' },
              { value: 'other', label: 'Other' },
            ]}
          />

          <Textarea
            label="Additional details"
            value={reportDetails}
            onChange={(e) => setReportDetails(e.target.value)}
            placeholder="Please provide more details..."
            rows={4}
          />

          <Button
            className="w-full"
            onClick={handleReport}
            loading={reportLoading}
            disabled={!reportCategory}
          >
            Submit report
          </Button>
        </div>
      </Modal>
    </div>
  )
}
