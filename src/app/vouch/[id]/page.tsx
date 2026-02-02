'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Button, Textarea, Select, Card, Avatar, Spinner } from '@/components/ui'
import { Shield, Check } from 'lucide-react'

interface User {
  id: string
  name: string | null
  photo: string | null
  bio: string | null
  city: string | null
}

export default function VouchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [relationshipType, setRelationshipType] = useState('FRIEND')
  const [note, setNote] = useState('')

  useEffect(() => {
    async function fetchUser() {
      try {
        // For simplicity, we'll make a simple request to get user info
        // In a real app, you'd have a dedicated public profile endpoint
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

  const handleSubmit = async () => {
    if (!session) {
      router.push(`/login?callbackUrl=/vouch/${id}`)
      return
    }

    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/vouches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toUserId: id,
          relationshipType,
          note: note || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to submit vouch')
        return
      }

      setSuccess(true)
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-8 text-center">
          <h1 className="text-xl font-bold text-gray-900">User not found</h1>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-8">
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Vouch submitted!</h1>
            <p className="text-gray-600 mb-6">
              Thank you for vouching for {user.name}. Your vouch helps build trust in the community.
            </p>
            <Link href="/dashboard">
              <Button>Back to dashboard</Button>
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Vouch for {user.name}</h1>
          <p className="text-gray-600 mt-2">
            Your vouch helps establish trust on Verto
          </p>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar src={user.photo} name={user.name} size="lg" />
            <div>
              <p className="font-semibold text-gray-900">{user.name}</p>
              {user.city && <p className="text-sm text-gray-500">{user.city}</p>}
            </div>
          </div>

          {user.bio && (
            <p className="text-gray-600 text-sm mb-6">{user.bio}</p>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Select
              label="How do you know this person?"
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value)}
              options={[
                { value: 'FRIEND', label: 'Friend' },
                { value: 'COWORKER', label: 'Coworker' },
                { value: 'FAMILY', label: 'Family' },
                { value: 'OTHER', label: 'Other' },
              ]}
            />

            <Textarea
              label="Add a note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Share how you know them or why you vouch for them..."
              rows={3}
            />

            <Button
              className="w-full"
              onClick={handleSubmit}
              loading={submitting}
            >
              {authStatus === 'authenticated' ? 'Submit vouch' : 'Sign in to vouch'}
            </Button>
          </div>
        </Card>

        <p className="text-sm text-gray-500 text-center">
          By vouching, you confirm that you personally know this person and trust them
          to be a good member of the Verto community.
        </p>
      </main>
    </div>
  )
}
