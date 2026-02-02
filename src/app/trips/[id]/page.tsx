'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/layout/Navbar'
import { Button, Card, Badge, Avatar, Textarea, Spinner, Modal, Input } from '@/components/ui'
import { MapPin, Calendar, MessageSquare, Key, Star, Home, Send, AlertCircle } from 'lucide-react'
import { formatDate, formatDateRange } from '@/lib/utils'

interface BookingDetails {
  id: string
  startDate: string
  endDate: string
  status: string
  creditsTotal: number
  guestMessage: string | null
  purpose: string
  hostId: string
  guestId: string
  listing: {
    id: string
    title: string
    city: string
    neighborhood: string | null
    fullAddress: string | null
    spaceType: string
    keyAccessMethod: string
    keyInstructions: string | null
    photos: { url: string }[]
    host: {
      id: string
      name: string
      photo: string | null
      email: string
    }
  }
  guest: {
    id: string
    name: string
    photo: string | null
    email: string
  }
  host: {
    id: string
    name: string
    photo: string | null
    email: string
  }
  reviews: {
    reviewerId: string
    rating: number
    text: string | null
  }[]
}

interface Message {
  id: string
  body: string
  createdAt: string
  sender: {
    id: string
    name: string
    photo: string | null
  }
}

const keyMethodLabels: Record<string, string> = {
  SMART_LOCK: 'Smart lock / keypad',
  LOCKBOX: 'Lockbox',
  IN_PERSON: 'In-person handoff',
  DOORMAN: 'Doorman / building staff',
}

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()

  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Message state
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  // Review modal
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)

  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false)

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login')
    }
  }, [authStatus, router])

  useEffect(() => {
    async function fetchData() {
      if (authStatus !== 'authenticated') return

      try {
        const [bookingRes, messagesRes] = await Promise.all([
          fetch(`/api/bookings/${id}`),
          fetch(`/api/messages?bookingId=${id}`),
        ])

        if (!bookingRes.ok) {
          router.push('/trips')
          return
        }

        const bookingData = await bookingRes.json()
        const messagesData = await messagesRes.json()

        setBooking(bookingData)
        setMessages(messagesData.messages || [])
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, authStatus, router])

  const handleAction = async (action: string) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (res.ok) {
        // Refresh booking data
        const bookingRes = await fetch(`/api/bookings/${id}`)
        const bookingData = await bookingRes.json()
        setBooking(bookingData)
        setShowCancelModal(false)
      }
    } catch (error) {
      console.error('Action failed:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    setSendingMessage(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: id,
          body: newMessage,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessages([...messages, data.data])
        setNewMessage('')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  const handleSubmitReview = async () => {
    setReviewLoading(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: id,
          rating: reviewRating,
          text: reviewText,
        }),
      })

      if (res.ok) {
        // Refresh booking data
        const bookingRes = await fetch(`/api/bookings/${id}`)
        const bookingData = await bookingRes.json()
        setBooking(bookingData)
        setShowReviewModal(false)
      }
    } catch (error) {
      console.error('Review failed:', error)
    } finally {
      setReviewLoading(false)
    }
  }

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!booking) {
    return null
  }

  const isHost = session?.user?.id === booking.hostId
  const isGuest = session?.user?.id === booking.guestId
  const otherUser = isHost ? booking.guest : booking.host
  const hasReviewed = booking.reviews.some((r) => r.reviewerId === session?.user?.id)
  const canReview = booking.status === 'COMPLETED' && !hasReviewed

  const statusColors: Record<string, string> = {
    REQUESTED: 'warning',
    CONFIRMED: 'success',
    COMPLETED: 'default',
    CANCELLED: 'error',
    DECLINED: 'error',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/trips" className="text-primary hover:text-primary-600 text-sm mb-2 inline-block">
            &larr; Back to trips
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{booking.listing.title}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={statusColors[booking.status] as 'default' | 'primary' | 'success' | 'warning' | 'error'}>
                  {booking.status}
                </Badge>
                <span className="text-gray-500">
                  {formatDateRange(booking.startDate, booking.endDate)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{booking.creditsTotal}</p>
              <p className="text-sm text-gray-500">credits</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Listing preview */}
            <Card className="overflow-hidden">
              <div className="flex">
                <div className="relative w-32 h-24 bg-gray-100 flex-shrink-0">
                  {booking.listing.photos[0] ? (
                    <Image
                      src={booking.listing.photos[0].url}
                      alt={booking.listing.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Home className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1">
                  <Link
                    href={`/listings/${booking.listing.id}`}
                    className="font-semibold text-gray-900 hover:text-primary"
                  >
                    {booking.listing.title}
                  </Link>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <MapPin className="w-4 h-4" />
                    {booking.listing.city}
                    {booking.listing.neighborhood && `, ${booking.listing.neighborhood}`}
                  </div>
                </div>
              </div>
            </Card>

            {/* Host actions */}
            {isHost && booking.status === 'REQUESTED' && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking request</h2>
                {booking.guestMessage && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Message from guest:</p>
                    <p className="text-gray-700">{booking.guestMessage}</p>
                  </div>
                )}
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleAction('accept')}
                    loading={actionLoading}
                    className="flex-1"
                  >
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleAction('decline')}
                    loading={actionLoading}
                    className="flex-1"
                  >
                    Decline
                  </Button>
                </div>
              </Card>
            )}

            {/* Key access info (only for confirmed) */}
            {(booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Key className="w-5 h-5 text-primary" />
                  Access information
                </h2>
                {booking.listing.fullAddress && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">Full address</p>
                    <p className="font-medium text-gray-900">{booking.listing.fullAddress}</p>
                  </div>
                )}
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-1">Access method</p>
                  <p className="font-medium text-gray-900">
                    {keyMethodLabels[booking.listing.keyAccessMethod]}
                  </p>
                </div>
                {booking.listing.keyInstructions && (
                  <div className="p-4 bg-primary-50 rounded-lg">
                    <p className="text-sm font-medium text-primary-700 mb-1">Instructions</p>
                    <p className="text-primary-600">{booking.listing.keyInstructions}</p>
                  </div>
                )}
              </Card>
            )}

            {/* Messages */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Messages
              </h2>

              <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                {messages.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No messages yet</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${
                        msg.sender.id === session?.user?.id ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <Avatar src={msg.sender.photo} name={msg.sender.name} size="sm" />
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          msg.sender.id === session?.user?.id
                            ? 'bg-primary text-white'
                            : 'bg-gray-100'
                        }`}
                      >
                        <p>{msg.body}</p>
                        <p
                          className={`text-xs mt-1 ${
                            msg.sender.id === session?.user?.id
                              ? 'text-primary-100'
                              : 'text-gray-500'
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage} loading={sendingMessage}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </Card>

            {/* Review prompt */}
            {canReview && (
              <Card className="p-6 border-2 border-primary-100">
                <div className="flex items-center gap-4">
                  <Star className="w-8 h-8 text-primary" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Leave a review</h3>
                    <p className="text-sm text-gray-500">
                      Share your experience with {otherUser.name}
                    </p>
                  </div>
                  <Button onClick={() => setShowReviewModal(true)}>Write review</Button>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Other user card */}
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <Avatar src={otherUser.photo} name={otherUser.name} size="lg" />
                <div>
                  <p className="font-semibold text-gray-900">{otherUser.name}</p>
                  <p className="text-sm text-gray-500">{isHost ? 'Guest' : 'Host'}</p>
                </div>
              </div>
              <Link
                href={`/users/${otherUser.id}`}
                className="block text-center text-primary hover:text-primary-600 text-sm"
              >
                View profile
              </Link>
            </Card>

            {/* Dates */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Dates
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Check-in</span>
                  <span className="font-medium">{formatDate(booking.startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Check-out</span>
                  <span className="font-medium">{formatDate(booking.endDate)}</span>
                </div>
              </div>
            </Card>

            {/* Actions */}
            {(booking.status === 'REQUESTED' || booking.status === 'CONFIRMED') && (
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>
                {isHost && booking.status === 'CONFIRMED' && (
                  <Button
                    variant="outline"
                    className="w-full mb-3"
                    onClick={() => handleAction('complete')}
                    loading={actionLoading}
                    disabled={new Date(booking.endDate) > new Date()}
                  >
                    Mark as complete
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full text-red-600 hover:bg-red-50"
                  onClick={() => setShowCancelModal(true)}
                >
                  Cancel booking
                </Button>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title={`Review ${otherUser.name}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setReviewRating(rating)}
                  className="p-1"
                >
                  <Star
                    className={`w-8 h-8 ${
                      rating <= reviewRating
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <Textarea
            label="Review (optional)"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your experience..."
            rows={4}
          />

          <Button
            className="w-full"
            onClick={handleSubmitReview}
            loading={reviewLoading}
          >
            Submit review
          </Button>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel booking"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Cancellation policy</p>
              <p className="text-sm text-yellow-700 mt-1">
                {booking.status === 'CONFIRMED'
                  ? 'Full credit refund if cancelled more than 48 hours before check-in. No refund for late cancellations.'
                  : 'This request has not been confirmed yet. No credits will be affected.'}
              </p>
            </div>
          </div>

          <p className="text-gray-600">
            Are you sure you want to cancel this booking?
          </p>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowCancelModal(false)}
            >
              Keep booking
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => handleAction('cancel')}
              loading={actionLoading}
            >
              Cancel booking
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
