'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { Button, Card, Select, Input, Textarea, Avatar, ModalSheet, Pill } from '@/components/ui'
import { getCityOptions } from '@/lib/cities'
import { Search, SlidersHorizontal, ArrowRight, Users, Calendar, Plus, Check } from 'lucide-react'
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

export default function SwapsPage() {
  const router = useRouter()
  const { status } = useSession()

  const [swaps, setSwaps] = useState<SwapRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [showFilters, setShowFilters] = useState(false)
  const [destinationFilter, setDestinationFilter] = useState('')
  const [originFilter, setOriginFilter] = useState('')
  const [activeChips, setActiveChips] = useState<string[]>([])

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

  // Fetch swaps
  useEffect(() => {
    fetchSwaps()
  }, [destinationFilter, originFilter])

  const fetchSwaps = async () => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams()
      if (destinationFilter) params.append('destinationCity', destinationFilter)
      if (originFilter) params.append('originCity', originFilter)

      const res = await fetch(`/api/swaps?${params.toString()}`)
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to fetch swaps')
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
      if (!res.ok) throw new Error(data.error || 'Failed to create swap request')

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

  const toggleChip = (chip: string) => {
    const cityMap: Record<string, string> = {
      'NYC': 'New York City',
      'Phoenix': 'Phoenix / Scottsdale',
      'Miami': 'Miami',
      'Austin': 'Austin',
    }

    if (activeChips.includes(chip)) {
      setActiveChips(activeChips.filter((c) => c !== chip))
      if (cityMap[chip]) setDestinationFilter('')
    } else {
      const otherCityChips = Object.keys(cityMap)
      setActiveChips([...activeChips.filter(c => !otherCityChips.includes(c)), chip])
      if (cityMap[chip]) setDestinationFilter(cityMap[chip])
    }
  }

  const clearFilters = () => {
    setActiveChips([])
    setDestinationFilter('')
    setOriginFilter('')
  }

  const cityOptions = getCityOptions()

  return (
    <>
      <MobileHeader
        rightAction={
          <button className="p-2 rounded-full hover:bg-gray-100">
            <Search className="w-5 h-5 text-gray-600" />
          </button>
        }
      />

      <div className="px-4 py-4">
        {/* Page title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Swaps</h1>

        {/* Utility row */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setShowFilters(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100">
            Sort
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          {['NYC', 'Phoenix', 'Miami', 'Austin'].map((city) => (
            <Pill
              key={city}
              active={activeChips.includes(city)}
              onClick={() => toggleChip(city)}
            >
              {city}
            </Pill>
          ))}
          <Pill
            active={activeChips.includes('2+ Vouches')}
            onClick={() => toggleChip('2+ Vouches')}
          >
            2+ Vouches
          </Pill>
          <Pill
            active={activeChips.includes('Entire Place')}
            onClick={() => toggleChip('Entire Place')}
          >
            Entire Place
          </Pill>
          {activeChips.length > 0 && (
            <Pill onClick={clearFilters} className="text-red-600 bg-red-50 hover:bg-red-100">
              Reset
            </Pill>
          )}
        </div>

        {/* Swaps list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <div className="animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-32" />
                    </div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-40 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-32" />
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="p-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchSwaps}>Try again</Button>
          </Card>
        ) : swaps.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500 mb-4">
              No swap requests found. Be the first!
            </p>
            <Button onClick={() => setShowPostModal(true)}>
              Post swap request
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {swaps.map((swap) => (
              <Card
                key={swap.id}
                hover
                className="p-4 cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => router.push(`/swaps/${swap.id}`)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Avatar
                    src={swap.createdBy.photo}
                    name={swap.createdBy.name}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">
                      {swap.createdBy.name || 'Anonymous'}
                    </p>
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <span>{swap.originCity.split(' ')[0]}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-primary" />
                      <span className="text-primary font-medium">
                        {swap.destinationCity.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/swaps/${swap.id}`)
                    }}
                  >
                    View
                  </Button>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(new Date(swap.startDate), 'MMM d')} – {format(new Date(swap.endDate), 'MMM d')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>{swap.guests}</span>
                  </div>
                </div>

                {swap.notes && (
                  <p className="text-sm text-gray-500 line-clamp-1 mb-3">{swap.notes}</p>
                )}

                <div className="pt-3 border-t border-gray-100">
                  <Pill variant="success" size="sm">
                    <Check className="w-3 h-3 mr-1" />
                    Vouched
                  </Pill>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Floating action button */}
      <button
        onClick={() => setShowPostModal(true)}
        className="fixed right-4 bottom-24 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-600 active:scale-95 transition-all z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Filter modal */}
      <ModalSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filters"
      >
        <div className="p-4 space-y-4">
          <Select
            label="Destination city"
            value={destinationFilter}
            onChange={(e) => setDestinationFilter(e.target.value)}
            options={[{ value: '', label: 'All cities' }, ...cityOptions]}
          />
          <Select
            label="Origin city"
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            options={[{ value: '', label: 'All cities' }, ...cityOptions]}
          />
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={clearFilters}>
              Clear all
            </Button>
            <Button className="flex-1" onClick={() => setShowFilters(false)}>
              Apply
            </Button>
          </div>
        </div>
      </ModalSheet>

      {/* Post swap modal */}
      <ModalSheet
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        title="Post swap request"
      >
        <div className="p-4 space-y-4">
          {postError && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {postError}
            </div>
          )}

          <Card className="p-4">
            <Select
              label="Where are you coming from?"
              value={formData.originCity}
              onChange={(e) => setFormData({ ...formData, originCity: e.target.value })}
              options={[{ value: '', label: 'Select city' }, ...cityOptions]}
            />
          </Card>

          <Card className="p-4">
            <Select
              label="Where do you want to go?"
              value={formData.destinationCity}
              onChange={(e) => setFormData({ ...formData, destinationCity: e.target.value })}
              options={[{ value: '', label: 'Select city' }, ...cityOptions]}
            />
            <p className="text-xs text-gray-500 mt-2">
              We&apos;re starting with our most popular cities. More coming soon.
            </p>
          </Card>

          <Card className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
              <Input
                label="End date"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </Card>

          <Card className="p-4">
            <Select
              label="Guests"
              value={formData.guests.toString()}
              onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
              options={[
                { value: '1', label: '1 guest' },
                { value: '2', label: '2 guests' },
                { value: '3', label: '3 guests' },
              ]}
            />
          </Card>

          <Card className="p-4">
            <Textarea
              label="Notes (optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Tell others about your trip..."
              rows={3}
            />
          </Card>

          <div className="sticky bottom-0 bg-white pt-4 pb-4 border-t border-gray-100 -mx-4 px-4">
            <Button
              onClick={handlePostSwap}
              loading={posting}
              disabled={
                !formData.originCity ||
                !formData.destinationCity ||
                !formData.startDate ||
                !formData.endDate
              }
              className="w-full"
            >
              Post request
            </Button>
          </div>
        </div>
      </ModalSheet>
    </>
  )
}
