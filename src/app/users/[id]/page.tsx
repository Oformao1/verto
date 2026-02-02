'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Card, Badge, Avatar, Spinner, Button } from '@/components/ui'
import { MapPin, Shield, Star, Home, Calendar, ExternalLink, Flag } from 'lucide-react'
import { getTierBadge } from '@/lib/tiers'
import { formatDate } from '@/lib/utils'

interface UserProfile {
  id: string
  name: string | null
  photo: string | null
  bio: string | null
  city: string | null
  workIndustry: string | null
  socialsLink: string | null
  createdAt: string
  hostTier: number
  vouchCount: number
  vouchesReceived: {
    id: string
    relationshipType: string
    note: string | null
    createdAt: string
    fromUser: {
      id: string
      name: string
      photo: string | null
    }
  }[]
  reviewsReceived: {
    id: string
    rating: number
    text: string | null
    createdAt: string
    reviewer: {
      id: string
      name: string
      photo: string | null
    }
    booking: {
      listing: {
        title: string
      }
    }
  }[]
  listings: {
    id: string
    title: string
    city: string
    creditsPerNight: number
    photos: { url: string }[]
  }[]
}

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()

  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`/api/users/${id}`)
        if (res.ok) {
          const data = await res.json()
          setUser(data)
        }
      } catch (err) {
        console.error('Failed to fetch user:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">User not found</h1>
            <Link href="/explore" className="text-primary hover:text-primary-600">
              Back to explore
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const tierBadge = getTierBadge(user.hostTier)
  const averageRating =
    user.reviewsReceived.length > 0
      ? user.reviewsReceived.reduce((acc, r) => acc + r.rating, 0) / user.reviewsReceived.length
      : 0
  const isOwnProfile = session?.user?.id === user.id

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <Card className="p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-6">
              <Avatar src={user.photo} name={user.name} size="xl" />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                  <Badge className={tierBadge.color}>{tierBadge.label}</Badge>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                  {user.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {user.city}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {formatDate(user.createdAt)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="font-medium">{user.vouchCount}</span> vouches
                  </div>
                  {averageRating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium">{averageRating.toFixed(1)}</span> rating
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Home className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{user.listings.length}</span> listings
                  </div>
                </div>
              </div>

              {!isOwnProfile && session && (
                <div className="flex flex-col gap-2">
                  <Link href={`/vouch/${user.id}`}>
                    <Button variant="outline" className="w-full">
                      <Shield className="w-4 h-4 mr-2" />
                      Vouch
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {user.bio && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h2 className="font-semibold text-gray-900 mb-2">About</h2>
                <p className="text-gray-600">{user.bio}</p>
              </div>
            )}

            {(user.workIndustry || user.socialsLink) && (
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                {user.workIndustry && (
                  <div>
                    <p className="text-gray-500">Work</p>
                    <p className="font-medium text-gray-900">{user.workIndustry}</p>
                  </div>
                )}
                {user.socialsLink && (
                  <div>
                    <p className="text-gray-500">Social</p>
                    <a
                      href={user.socialsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:text-primary-600 inline-flex items-center gap-1"
                    >
                      View profile
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Listings */}
            {user.listings.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Listings ({user.listings.length})
                </h2>
                <div className="space-y-4">
                  {user.listings.map((listing) => (
                    <Link
                      key={listing.id}
                      href={`/listings/${listing.id}`}
                      className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors -mx-3"
                    >
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {listing.photos[0] ? (
                          <Image
                            src={listing.photos[0].url}
                            alt={listing.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Home className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{listing.title}</h3>
                        <p className="text-sm text-gray-500">{listing.city}</p>
                        <p className="text-sm text-primary font-medium mt-1">
                          {listing.creditsPerNight} credits/night
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            {/* Vouches */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Vouches ({user.vouchesReceived.length})
              </h2>
              {user.vouchesReceived.length === 0 ? (
                <p className="text-gray-500">No vouches yet</p>
              ) : (
                <div className="space-y-4">
                  {user.vouchesReceived.slice(0, 5).map((vouch) => (
                    <div
                      key={vouch.id}
                      className="flex gap-3 pb-4 border-b border-gray-100 last:border-0"
                    >
                      <Avatar
                        src={vouch.fromUser.photo}
                        name={vouch.fromUser.name}
                        size="sm"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{vouch.fromUser.name}</p>
                        <p className="text-xs text-gray-500 capitalize">
                          {vouch.relationshipType.toLowerCase()}
                        </p>
                        {vouch.note && (
                          <p className="text-sm text-gray-600 mt-1">&quot;{vouch.note}&quot;</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Reviews */}
            <Card className="p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Reviews ({user.reviewsReceived.length})
              </h2>
              {user.reviewsReceived.length === 0 ? (
                <p className="text-gray-500">No reviews yet</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.reviewsReceived.map((review) => (
                    <div key={review.id} className="p-4 bg-gray-50 rounded-lg">
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
                                className={`w-3 h-3 ${
                                  i < review.rating
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      {review.text && (
                        <p className="text-sm text-gray-600">{review.text}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {review.booking.listing.title}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
