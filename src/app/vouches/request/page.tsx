'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Button, Input, Textarea, Select, Card } from '@/components/ui'
import { Shield, Copy, Check } from 'lucide-react'

export default function VouchRequestPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [copied, setCopied] = useState(false)

  if (status === 'unauthenticated') {
    router.push('/login?callbackUrl=/vouches/request')
    return null
  }

  const vouchLink = typeof window !== 'undefined'
    ? `${window.location.origin}/vouch/${session?.user?.id}`
    : ''

  const copyLink = () => {
    navigator.clipboard.writeText(vouchLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Request a vouch</h1>
          <p className="text-gray-600 mt-2">
            Ask friends, family, or coworkers to vouch for you on Verto
          </p>
        </div>

        <Card className="p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Share your vouch link</h2>
          <p className="text-sm text-gray-600 mb-4">
            Send this link to people who know you. They can vouch for you once they have a Verto account.
          </p>
          <div className="flex gap-2">
            <Input value={vouchLink} readOnly />
            <Button variant="outline" onClick={copyLink}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4">What are vouches?</h2>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex gap-2">
              <span className="text-primary font-bold">•</span>
              Vouches show that real people trust you
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">•</span>
              Hosts see your vouch count when reviewing requests
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">•</span>
              More vouches = more trust in the community
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">•</span>
              Vouchers must have an account for at least 3 days
            </li>
          </ul>
        </Card>
      </main>
    </div>
  )
}
