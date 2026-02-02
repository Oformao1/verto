'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Card, Avatar, Badge, Spinner } from '@/components/ui'
import { MessageSquare } from 'lucide-react'

interface Conversation {
  bookingId: string
  listing: {
    title: string
  }
  otherUser: {
    id: string
    name: string
    photo: string | null
  }
  lastMessage: {
    body: string
    createdAt: string
  } | null
  unreadCount: number
  status: string
}

export default function MessagesPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login?callbackUrl=/messages')
    }
  }, [authStatus, router])

  useEffect(() => {
    async function fetchConversations() {
      if (authStatus !== 'authenticated') return

      try {
        const res = await fetch('/api/messages')
        const data = await res.json()
        setConversations(data.conversations || [])
      } catch (error) {
        console.error('Failed to fetch conversations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [authStatus])

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Messages</h1>

        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
            <p className="text-gray-500">
              Messages will appear here when you have booking conversations.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((convo) => (
              <Link key={convo.bookingId} href={`/trips/${convo.bookingId}`}>
                <Card
                  hover
                  className={`p-4 ${convo.unreadCount > 0 ? 'border-primary' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar
                        src={convo.otherUser.photo}
                        name={convo.otherUser.name}
                        size="lg"
                      />
                      {convo.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                          {convo.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {convo.otherUser.name}
                        </span>
                        <Badge variant="default" className="text-xs">
                          {convo.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {convo.listing.title}
                      </p>
                      {convo.lastMessage && (
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {convo.lastMessage.body}
                        </p>
                      )}
                    </div>
                    {convo.lastMessage && (
                      <span className="text-xs text-gray-400">
                        {new Date(convo.lastMessage.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
