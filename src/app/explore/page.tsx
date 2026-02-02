'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Input, Select, Card, Badge, Spinner } from '@/components/ui'
import { Search, MapPin, Users, Coins, Home } from 'lucide-react'
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="bg-white rounded-xl p-6 shadow-card mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search by city..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select
                value={spaceType}
                onChange={(e) => setSpaceType(e.target.value)}
                options={[
                  { value: '', label: 'All space types' },
                  { value: 'ROOM', label: 'Private room' },
                  { value: 'ENTIRE_PLACE', label: 'Entire place' },
                ]}
              />

              <Select
                value={minTier}
                onChange={(e) => setMinTier(e.target.value)}
                options={[
                  { value: '', label: 'All host tiers' },
                  { value: '1', label: 'Tier 1+' },
                  { value: '2', label: 'Tier 2+' },
                  { value: '3', label: 'Tier 3 (Super Hosts)' },
                ]}
              />

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{listings.length} listings found</span>
              </div>
            </div>
          </div>

          {/* Listings grid */}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

function ListingCard({ listing }: { listing: Listing }) {
  const tierBadge = getTierBadge(listing.hostTier)
  const photoUrl = listing.photos[0]?.url || '/placeholder.jpg'

  return (
    <Link href={`/listings/${listing.id}`}>
      <Card hover className="overflow-hidden">
        <div className="relative aspect-[4/3] bg-gray-100">
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
