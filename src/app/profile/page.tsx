'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Button, Input, Textarea, Select, Card, Avatar, Badge, Spinner } from '@/components/ui'
import { getTierBadge, getUserHostTier } from '@/lib/tiers'
import { Edit2, Copy, Check, Shield, Star, Coins, ExternalLink } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Profile {
  id: string
  email: string
  name: string | null
  photo: string | null
  bio: string | null
  city: string | null
  workIndustry: string | null
  socialsLink: string | null
  modeInterest: string
  emailVerified: boolean
  phoneVerified: boolean
  referralCode: string
  createdAt: string
}

interface Vouch {
  id: string
  relationshipType: string
  note: string | null
  createdAt: string
  fromUser: {
    id: string
    name: string
    photo: string | null
  }
}

interface Review {
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
}

export default function ProfilePage() {
  const { data: session, status: authStatus, update } = useSession()
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [vouches, setVouches] = useState<Vouch[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [creditBalance, setCreditBalance] = useState(0)
  const [hostTier, setHostTier] = useState(0)
  const [loading, setLoading] = useState(true)

  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: '',
    bio: '',
    city: '',
    workIndustry: '',
    socialsLink: '',
    modeInterest: 'SWAPPER',
  })
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login?callbackUrl=/profile')
    }
  }, [authStatus, router])

  useEffect(() => {
    async function fetchData() {
      if (authStatus !== 'authenticated' || !session?.user?.id) return

      try {
        const [profileRes, vouchesRes, reviewsRes, creditsRes] = await Promise.all([
          fetch('/api/profile'),
          fetch(`/api/vouches?userId=${session.user.id}`),
          fetch(`/api/reviews?userId=${session.user.id}&role=reviewee`),
          fetch('/api/credits'),
        ])

        const [profileData, vouchesData, reviewsData, creditsData] = await Promise.all([
          profileRes.json(),
          vouchesRes.json(),
          reviewsRes.json(),
          creditsRes.json(),
        ])

        setProfile(profileData)
        setVouches(vouchesData.vouches || [])
        setReviews(reviewsData.reviews || [])
        setCreditBalance(creditsData.balance || 0)

        // Fetch host tier
        const tierRes = await fetch(`/api/listings?hostId=${session.user.id}`)
        // For now, calculate tier on the fly (in a real app this would be from a dedicated endpoint)
        setHostTier(0) // Will be updated when there's data

        setEditData({
          name: profileData.name || '',
          bio: profileData.bio || '',
          city: profileData.city || '',
          workIndustry: profileData.workIndustry || '',
          socialsLink: profileData.socialsLink || '',
          modeInterest: profileData.modeInterest || 'SWAPPER',
        })
      } catch (error) {
        console.error('Failed to fetch profile data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [authStatus, session])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })

      if (res.ok) {
        const data = await res.json()
        setProfile(data.user)
        setEditing(false)
        await update()
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const copyReferralLink = () => {
    if (profile) {
      navigator.clipboard.writeText(`${window.location.origin}/signup?ref=${profile.referralCode}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!profile) {
    return null
  }

  const tierBadge = getTierBadge(hostTier)
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-6">
            <Avatar src={profile.photo} name={profile.name} size="xl" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
              <p className="text-gray-500">{profile.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={tierBadge.color}>{tierBadge.label}</Badge>
                {profile.emailVerified && (
                  <Badge variant="success">Email verified</Badge>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setEditing(!editing)}
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit profile
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 text-center">
            <Coins className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{creditBalance}</p>
            <p className="text-sm text-gray-500">Credits</p>
          </Card>
          <Card className="p-4 text-center">
            <Shield className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{vouches.length}</p>
            <p className="text-sm text-gray-500">Vouches</p>
          </Card>
          <Card className="p-4 text-center">
            <Star className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {averageRating > 0 ? averageRating.toFixed(1) : '-'}
            </p>
            <p className="text-sm text-gray-500">Rating</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">Tier {hostTier}</p>
            <p className="text-sm text-gray-500">Host level</p>
          </Card>
        </div>

        {/* Edit form or profile content */}
        {editing ? (
          <Card className="p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Edit profile</h2>
            <div className="space-y-4">
              <Input
                label="Name"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              />
              <Textarea
                label="Bio"
                value={editData.bio}
                onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                rows={4}
              />
              <Input
                label="City"
                value={editData.city}
                onChange={(e) => setEditData({ ...editData, city: e.target.value })}
              />
              <Input
                label="Work / Industry"
                value={editData.workIndustry}
                onChange={(e) => setEditData({ ...editData, workIndustry: e.target.value })}
              />
              <Input
                label="Social link"
                value={editData.socialsLink}
                onChange={(e) => setEditData({ ...editData, socialsLink: e.target.value })}
              />
              <Select
                label="I'm interested in..."
                value={editData.modeInterest}
                onChange={(e) => setEditData({ ...editData, modeInterest: e.target.value })}
                options={[
                  { value: 'GUEST', label: 'Finding stays (Guest)' },
                  { value: 'HOST', label: 'Hosting travelers (Host)' },
                  { value: 'SWAPPER', label: 'Both (Swapper)' },
                ]}
              />
              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} loading={saving}>
                  Save changes
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
            {profile.bio ? (
              <p className="text-gray-600 mb-4">{profile.bio}</p>
            ) : (
              <p className="text-gray-400 italic mb-4">No bio yet</p>
            )}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {profile.city && (
                <div>
                  <p className="text-gray-500">Location</p>
                  <p className="font-medium text-gray-900">{profile.city}</p>
                </div>
              )}
              {profile.workIndustry && (
                <div>
                  <p className="text-gray-500">Work</p>
                  <p className="font-medium text-gray-900">{profile.workIndustry}</p>
                </div>
              )}
              {profile.socialsLink && (
                <div>
                  <p className="text-gray-500">Social</p>
                  <a
                    href={profile.socialsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:text-primary-600 inline-flex items-center gap-1"
                  >
                    View profile
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              <div>
                <p className="text-gray-500">Member since</p>
                <p className="font-medium text-gray-900">{formatDate(profile.createdAt)}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Referral */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invite friends</h2>
          <p className="text-gray-600 mb-4">
            Share your referral link. When friends sign up and complete their profile,
            you both earn bonus credits!
          </p>
          <div className="flex gap-2">
            <Input
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref=${profile.referralCode}`}
              readOnly
            />
            <Button variant="outline" onClick={copyReferralLink}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </Card>

        {/* Vouches */}
        <Card className="p-6 mb-8" id="vouches">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Vouches ({vouches.length})
            </h2>
            <Link
              href="/vouches/request"
              className="text-sm text-primary hover:text-primary-600"
            >
              Request a vouch
            </Link>
          </div>
          {vouches.length === 0 ? (
            <p className="text-gray-500">No vouches yet. Ask friends to vouch for you!</p>
          ) : (
            <div className="space-y-4">
              {vouches.map((vouch) => (
                <div key={vouch.id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0">
                  <Avatar src={vouch.fromUser.photo} name={vouch.fromUser.name} size="md" />
                  <div>
                    <p className="font-medium text-gray-900">{vouch.fromUser.name}</p>
                    <p className="text-sm text-gray-500 capitalize">
                      {vouch.relationshipType.toLowerCase()} · {formatDate(vouch.createdAt)}
                    </p>
                    {vouch.note && (
                      <p className="text-gray-600 mt-1">&quot;{vouch.note}&quot;</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Reviews */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Reviews ({reviews.length})
          </h2>
          {reviews.length === 0 ? (
            <p className="text-gray-500">No reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="pb-4 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar src={review.reviewer.photo} name={review.reviewer.name} size="sm" />
                    <div>
                      <p className="font-medium text-gray-900">{review.reviewer.name}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex">
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
                        <span className="text-sm text-gray-500">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {review.text && <p className="text-gray-600">{review.text}</p>}
                  <p className="text-sm text-gray-400 mt-1">
                    For: {review.booking.listing.title}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}
