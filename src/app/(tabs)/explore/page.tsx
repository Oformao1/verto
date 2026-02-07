'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { Input, Select, Card, Badge, Spinner, Pill } from '@/components/ui'
import { Search, MapPin, Users, Coins, Home, SlidersHorizontal } from 'lucide-react'
import { getTierBadge } from '@/lib/tiers'

interface Listing {
  id: string
  title: string
  city: string
  spaceType: 'ROOM' | 'ENTIRE_PLACE'
  creditsPerNight: number
  maxGuests: number
  photos: { url: string }[]
  host: {
    id: string
    name: string
    photo: string | null
  }
  hostTier: number
  vouchCount: number
}

export default function ExplorePage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [city, setCity] = useState('')
  const [spaceType, setSpaceType] = useState('')
  const [minTier, setMinTier] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const fetchListings = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (city) params.set('city', city)
      if (spaceType) params.set('spaceType', spaceType)
      if (minTier) params.set('minTier', minTier)

      const res = await fetch(`/api/listings?${params}`)
      const data = await res.json()
      setListings(data.listings || [])
    } catch (error) {
      console.error('Failed to fetch listings:', error)
    } finally {
      setLoading(false)
    }
  }, [city, spaceType, minTier])

  useEffect(() => {
    const debounce = setTimeout(fetchListings, 300)
    return () => clearTimeout(debounce)
  }, [fetchListings])

  return (
    <>
      <MobileHeader
        rightAction={
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <Search className="w-5 h-5 text-gray-600" />
          </button>
        }
      />

      <div className="px-4 py-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Find hosts</h1>

        {/* Search bar - toggleable */}
        {showSearch && (
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by city..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          <Pill
            active={spaceType === 'ENTIRE_PLACE'}
            onClick={() => setSpaceType(spaceType === 'ENTIRE_PLACE' ? '' : 'ENTIRE_PLACE')}
          >
            Entire place
          </Pill>
          <Pill
            active={spaceType === 'ROOM'}
            onClick={() => setSpaceType(spaceType === 'ROOM' ? '' : 'ROOM')}
          >
            Private room
          </Pill>
          <Pill
            active={minTier === '2'}
            onClick={() => setMinTier(minTier === '2' ? '' : '2')}
          >
            Tier 2+
          </Pill>
          <Pill
            active={minTier === '3'}
            onClick={() => setMinTier(minTier === '3' ? '' : '3')}
          >
            Super Hosts
          </Pill>
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-500 mb-4">{listings.length} listings found</p>

        {/* Listings */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No listings found
            </h3>
            <p className="text-gray-500">
              Try adjusting your filters or search in a different city.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function ListingCard({ listing }: { listing: Listing }) {
  const tierBadge = getTierBadge(listing.hostTier)
  const photoUrl = listing.photos[0]?.url || '/placeholder.jpg'

  return (
    <Link href={`/listings/${listing.id}`}>
      <Card hover className="overflow-hidden">
        <div className="relative aspect-[16/9] bg-gray-100">
          {listing.photos[0] ? (
            <Image
              src={photoUrl}
              alt={listing.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Home className="w-12 h-12 text-gray-300" />
            </div>
          )}
          <div className="absolute top-3 right-3">
            <Badge className={tierBadge.color}>{tierBadge.label}</Badge>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
            <MapPin className="w-4 h-4" />
            {listing.city}
          </div>

          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
            {listing.title}
          </h3>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3 text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {listing.maxGuests}
              </span>
              <span className="capitalize">
                {listing.spaceType === 'ENTIRE_PLACE' ? 'Entire place' : 'Room'}
              </span>
            </div>

            <div className="flex items-center gap-1 font-semibold text-primary">
              <Coins className="w-4 h-4" />
              {listing.creditsPerNight}/night
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-500">
            <span>{listing.vouchCount} vouches</span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
