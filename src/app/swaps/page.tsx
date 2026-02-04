'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Button, Select, Card, Input, Textarea, Avatar } from '@/components/ui'
import { MVP_CITIES, getCityOptions } from '@/lib/cities'
import { Plus, ArrowRight, Users, Calendar, X } from 'lucide-react'
import { format } from 'date-fns'

interface SwapRequest {
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
  }
}

const DESTINATION_STORAGE_KEY = 'verto_my_destination'

export default function SwapsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [swaps, setSwaps] = useState<SwapRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [destinationFilter, setDestinationFilter] = useState('')
  const [originFilter, setOriginFilter] = useState('')
  const [myDestinationsMode, setMyDestinationsMode] = useState(false)
  const [savedDestination, setSavedDestination] = useState('')

  // Post swap modal
  const [showPostModal, setShowPostModal] = useState(false)
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState('')
  const [formData, setFormData] = useState({
    originCity: '',
    destinationCity: '',
    startDate: '',
    endDate: '',
    guests: 1,
    notes: '',
  })

  // Load saved destination from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(DESTINATION_STORAGE_KEY)
    if (saved && MVP_CITIES.includes(saved as typeof MVP_CITIES[number])) {
      setSavedDestination(saved)
    }
  }, [])

  // Save destination when filter changes
  useEffect(() => {
    if (destinationFilter && destinationFilter !== '') {
      localStorage.setItem(DESTINATION_STORAGE_KEY, destinationFilter)
      setSavedDestination(destinationFilter)
    }
  }, [destinationFilter])

  // Fetch swaps
  useEffect(() => {
    fetchSwaps()
  }, [destinationFilter, originFilter, myDestinationsMode, savedDestination])

  const fetchSwaps = async () => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams()

      // Apply filters
      const effectiveDestination = myDestinationsMode && savedDestination
        ? savedDestination
        : destinationFilter

      if (effectiveDestination) {
        params.append('destinationCity', effectiveDestination)
      }
      if (originFilter) {
        params.append('originCity', originFilter)
      }

      const res = await fetch(`/api/swaps?${params.toString()}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch swaps')
      }

      setSwaps(data.swaps)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handlePostSwap = async () => {
    if (status !== 'authenticated') {
      router.push('/login?callbackUrl=/swaps')
      return
    }

    setPosting(true)
    setPostError('')

    try {
      const res = await fetch('/api/swaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create swap request')
      }

      // Add new swap to the list
      setSwaps((prev) => [data.swapRequest, ...prev])
      setShowPostModal(false)
      setFormData({
        originCity: '',
        destinationCity: '',
        startDate: '',
        endDate: '',
        guests: 1,
        notes: '',
      })
    } catch (err) {
      setPostError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setPosting(false)
    }
  }

  const cityOptions = [
    { value: '', label: 'All cities' },
    ...getCityOptions(),
  ]

  const cityOptionsRequired = getCityOptions()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Swaps</h1>
            <p className="text-gray-600 mt-1">
              Find people looking to swap homes in different cities
            </p>
          </div>
          <Button onClick={() => setShowPostModal(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Post swap request
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Toggle: All swaps vs My destinations */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMyDestinationsMode(false)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  !myDestinationsMode
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All swaps
              </button>
              <button
                onClick={() => setMyDestinationsMode(true)}
                disabled={!savedDestination}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  myDestinationsMode
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } ${!savedDestination ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                My destinations
                {savedDestination && (
                  <span className="ml-1 text-xs opacity-75">({savedDestination.split(' ')[0]})</span>
                )}
              </button>
            </div>

            {/* Destination filter */}
            {!myDestinationsMode && (
              <div className="flex-1 sm:max-w-xs">
                <Select
                  value={destinationFilter}
                  onChange={(e) => setDestinationFilter(e.target.value)}
                  options={cityOptions}
                  label="Destination"
                />
              </div>
            )}

            {/* Origin filter */}
            <div className="flex-1 sm:max-w-xs">
              <Select
                value={originFilter}
                onChange={(e) => setOriginFilter(e.target.value)}
                options={cityOptions}
                label="Origin"
              />
            </div>
          </div>

          {savedDestination && !myDestinationsMode && (
            <p className="text-xs text-gray-500 mt-3">
              Tip: Select a destination to save it as &quot;My destinations&quot; for quick filtering.
            </p>
          )}
        </Card>

        {/* Swaps list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <div className="animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-1/4" />
                    </div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-2/3" />
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="p-8 text-center">
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchSwaps} className="mt-4">
              Try again
            </Button>
          </Card>
        ) : swaps.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500 mb-4">
              {destinationFilter || originFilter || myDestinationsMode
                ? 'No swap requests match your filters.'
                : 'No swap requests yet. Be the first to post one!'}
            </p>
            <Button onClick={() => setShowPostModal(true)}>
              Post swap request
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {swaps.map((swap) => (
              <Card key={swap.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <Avatar
                    src={swap.createdBy.photo}
                    name={swap.createdBy.name}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      {swap.createdBy.name || 'Anonymous'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Posted {format(new Date(swap.createdAt), 'MMM d, yyyy')}
                    </p>

                    {/* Cities */}
                    <div className="flex items-center gap-2 mt-3 text-lg font-medium">
                      <span className="text-gray-900">{swap.originCity}</span>
                      <ArrowRight className="w-5 h-5 text-primary" />
                      <span className="text-primary">{swap.destinationCity}</span>
                    </div>

                    {/* Details */}
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(new Date(swap.startDate), 'MMM d')} -{' '}
                          {format(new Date(swap.endDate), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{swap.guests} guest{swap.guests > 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {/* Notes preview */}
                    {swap.notes && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {swap.notes}
                      </p>
                    )}
                  </div>

                  {/* Action button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (status !== 'authenticated') {
                        router.push('/login?callbackUrl=/swaps')
                      } else {
                        router.push(`/users/${swap.createdBy.id}`)
                      }
                    }}
                  >
                    View
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Post swap modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowPostModal(false)}
          />
          <Card className="relative z-10 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Post swap request</h2>
              <button
                onClick={() => setShowPostModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {postError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                {postError}
              </div>
            )}

            <div className="space-y-4">
              <Select
                label="Where are you coming from?"
                value={formData.originCity}
                onChange={(e) => setFormData({ ...formData, originCity: e.target.value })}
                options={[{ value: '', label: 'Select your city' }, ...cityOptionsRequired]}
                required
              />

              <Select
                label="Where do you want to go?"
                value={formData.destinationCity}
                onChange={(e) => setFormData({ ...formData, destinationCity: e.target.value })}
                options={[{ value: '', label: 'Select destination' }, ...cityOptionsRequired]}
                required
              />

              <p className="text-xs text-gray-500 -mt-2">
                We&apos;re starting with our most popular cities. More coming soon.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start date"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
                <Input
                  label="End date"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>

              <Select
                label="Number of guests"
                value={formData.guests.toString()}
                onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
                options={[
                  { value: '1', label: '1 guest' },
                  { value: '2', label: '2 guests' },
                  { value: '3', label: '3 guests' },
                ]}
              />

              <Textarea
                label="Notes (optional)"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Tell others about your trip, what you're looking for, etc."
                rows={3}
              />

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPostModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePostSwap}
                  loading={posting}
                  disabled={
                    !formData.originCity ||
                    !formData.destinationCity ||
                    !formData.startDate ||
                    !formData.endDate
                  }
                  className="flex-1"
                >
                  Post request
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
