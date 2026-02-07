'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MobileLayout } from '@/components/layout/MobileLayout'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { Button, Input, Textarea, Select, Card, Avatar, Badge, Spinner, ModalSheet, Pill } from '@/components/ui'
import { getTierBadge } from '@/lib/tiers'
import {
  Edit2,
  Copy,
  Check,
  Shield,
  Star,
  Coins,
  ExternalLink,
  MapPin,
  Briefcase,
  Mail,
  Phone,
  ChevronRight,
  Settings,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
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

  const [showEditModal, setShowEditModal] = useState(false)
  const [showVouchesModal, setShowVouchesModal] = useState(false)
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
  const [referralLink, setReferralLink] = useState('')

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login?callbackUrl=/profile')
    }
  }, [authStatus, router])

  useEffect(() => {
    if (profile?.referralCode) {
      setReferralLink(`${window.location.origin}/signup?ref=${profile.referralCode}`)
    }
  }, [profile?.referralCode])

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
        setHostTier(0)

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
        setShowEditModal(false)
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
      navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (authStatus === 'loading' || loading) {
    return (
      <MobileLayout header={<MobileHeader title="Profile" />}>
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </MobileLayout>
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
    <MobileLayout
      header={
        <MobileHeader
          rightAction={
            <button
              onClick={() => router.push('/settings')}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          }
        />
      }
    >
      <div className="px-4 py-4 space-y-4">
        {/* Profile Header Card */}
        <Card className="p-4">
          <div className="flex items-start gap-4">
            <Avatar src={profile.photo} name={profile.name} size="xl" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 truncate">
                  {profile.name || 'Anonymous'}
                </h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditModal(true)}
                  className="p-1.5 h-auto"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-500 truncate">{profile.email}</p>

              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge className={tierBadge.color}>{tierBadge.label}</Badge>
                {profile.modeInterest === 'SWAPPER' && (
                  <Pill size="sm">Swapper</Pill>
                )}
                {profile.modeInterest === 'HOST' && (
                  <Pill size="sm">Host</Pill>
                )}
                {profile.modeInterest === 'GUEST' && (
                  <Pill size="sm">Guest</Pill>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-gray-600 text-sm mt-4 leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Quick info */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-sm text-gray-500">
            {profile.city && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>{profile.city}</span>
              </div>
            )}
            {profile.workIndustry && (
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>{profile.workIndustry}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2">
          <Card className="p-3 text-center">
            <Coins className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{creditBalance}</p>
            <p className="text-xs text-gray-500">Credits</p>
          </Card>
          <Card
            className="p-3 text-center cursor-pointer active:scale-[0.98] transition-transform"
            onClick={() => setShowVouchesModal(true)}
          >
            <Shield className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{vouches.length}</p>
            <p className="text-xs text-gray-500">Vouches</p>
          </Card>
          <Card className="p-3 text-center">
            <Star className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">
              {averageRating > 0 ? averageRating.toFixed(1) : '-'}
            </p>
            <p className="text-xs text-gray-500">Rating</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-lg font-bold text-gray-900">T{hostTier}</p>
            <p className="text-xs text-gray-500 mt-1">Host Tier</p>
          </Card>
        </div>

        {/* Trust & Verification Card */}
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Trust & Verification</h2>
              <p className="text-sm text-gray-500">Build trust with the community</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Email verification */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Email</span>
              </div>
              {profile.emailVerified ? (
                <div className="flex items-center gap-1.5 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  Verified
                </div>
              ) : (
                <Button variant="ghost" size="sm" className="text-primary">
                  Verify now
                </Button>
              )}
            </div>

            {/* Phone verification */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Phone</span>
              </div>
              {profile.phoneVerified ? (
                <div className="flex items-center gap-1.5 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  Verified
                </div>
              ) : (
                <Button variant="ghost" size="sm" className="text-primary">
                  Add phone
                </Button>
              )}
            </div>

            {/* Vouches */}
            <button
              onClick={() => setShowVouchesModal(true)}
              className="flex items-center justify-between py-2 w-full"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Vouches</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {vouches.length}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </button>
          </div>

          {vouches.length < 2 && (
            <div className="mt-4 p-3 bg-amber-50 rounded-lg">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-800 font-medium">
                    Get more vouches
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Members with 2+ vouches get more responses
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link href="/vouches/request">
              <Button variant="outline" className="w-full">
                Request a vouch
              </Button>
            </Link>
          </div>
        </Card>

        {/* Invite Friends Card */}
        <Card className="p-4">
          <h2 className="font-semibold text-gray-900 mb-2">Invite friends</h2>
          <p className="text-sm text-gray-600 mb-4">
            Share your link. When friends join, you both earn credits!
          </p>
          <div className="flex gap-2">
            <Input
              value={referralLink}
              readOnly
              className="text-sm"
            />
            <Button variant="outline" onClick={copyReferralLink} className="flex-shrink-0">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </Card>

        {/* Reviews Card */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">
              Reviews ({reviews.length})
            </h2>
            {averageRating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-medium">{averageRating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {reviews.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No reviews yet. Complete stays to get reviewed!
            </p>
          ) : (
            <div className="space-y-4">
              {reviews.slice(0, 3).map((review) => (
                <div key={review.id} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar src={review.reviewer.photo} name={review.reviewer.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {review.reviewer.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex">
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
                  </div>
                  {review.text && (
                    <p className="text-sm text-gray-600 line-clamp-2">{review.text}</p>
                  )}
                </div>
              ))}
              {reviews.length > 3 && (
                <Button variant="ghost" className="w-full text-primary">
                  View all {reviews.length} reviews
                </Button>
              )}
            </div>
          )}
        </Card>

        {/* Social link */}
        {profile.socialsLink && (
          <Card className="p-4">
            <a
              href={profile.socialsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-sm"
            >
              <span className="text-gray-600">Social profile</span>
              <div className="flex items-center gap-1.5 text-primary">
                View
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </a>
          </Card>
        )}

        {/* Member since */}
        <p className="text-center text-xs text-gray-400 py-4">
          Member since {formatDate(profile.createdAt)}
        </p>
      </div>

      {/* Edit Profile Modal */}
      <ModalSheet
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit profile"
      >
        <div className="p-4 space-y-4">
          <Card className="p-4">
            <Input
              label="Name"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            />
          </Card>

          <Card className="p-4">
            <Textarea
              label="Bio"
              value={editData.bio}
              onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
              rows={3}
              placeholder="Tell others about yourself..."
            />
          </Card>

          <Card className="p-4 space-y-4">
            <Input
              label="City"
              value={editData.city}
              onChange={(e) => setEditData({ ...editData, city: e.target.value })}
              placeholder="e.g., New York"
            />
            <Input
              label="Work / Industry"
              value={editData.workIndustry}
              onChange={(e) => setEditData({ ...editData, workIndustry: e.target.value })}
              placeholder="e.g., Tech, Finance"
            />
            <Input
              label="Social link"
              value={editData.socialsLink}
              onChange={(e) => setEditData({ ...editData, socialsLink: e.target.value })}
              placeholder="https://..."
            />
          </Card>

          <Card className="p-4">
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
          </Card>

          <div className="sticky bottom-0 bg-white pt-4 pb-4 border-t border-gray-100 -mx-4 px-4">
            <Button onClick={handleSave} loading={saving} className="w-full">
              Save changes
            </Button>
          </div>
        </div>
      </ModalSheet>

      {/* Vouches Modal */}
      <ModalSheet
        isOpen={showVouchesModal}
        onClose={() => setShowVouchesModal(false)}
        title={`Your vouches (${vouches.length})`}
      >
        <div className="p-4 space-y-4">
          {vouches.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No vouches yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Ask friends and past hosts to vouch for you
              </p>
              <Link href="/vouches/request">
                <Button className="mt-4">Request a vouch</Button>
              </Link>
            </div>
          ) : (
            <>
              {vouches.map((vouch) => (
                <Card key={vouch.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={vouch.fromUser.photo}
                      name={vouch.fromUser.name}
                      size="md"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {vouch.fromUser.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {vouch.relationshipType.charAt(0) + vouch.relationshipType.slice(1).toLowerCase()}
                        {' '}&middot;{' '}
                        {formatDate(vouch.createdAt)}
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
              ))}
              <Link href="/vouches/request" className="block">
                <Button variant="outline" className="w-full">
                  Request more vouches
                </Button>
              </Link>
            </>
          )}
        </div>
      </ModalSheet>
    </MobileLayout>
  )
}
