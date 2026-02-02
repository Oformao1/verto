'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Card, Badge, Spinner } from '@/components/ui'
import { Coins, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface LedgerEntry {
  id: string
  amount: number
  type: string
  bookingId: string | null
  note: string | null
  createdAt: string
}

const typeLabels: Record<string, { label: string; color: string }> = {
  BOOKING_CONFIRMED_DEBIT: { label: 'Booking payment', color: 'error' },
  BOOKING_CONFIRMED_CREDIT: { label: 'Hosting income', color: 'success' },
  BOOKING_CANCELLED_REVERSAL: { label: 'Cancellation refund', color: 'warning' },
  REFERRAL_BONUS: { label: 'Referral bonus', color: 'primary' },
  ADMIN_ADJUSTMENT: { label: 'Admin adjustment', color: 'default' },
  INITIAL_CREDIT: { label: 'Welcome bonus', color: 'success' },
}

export default function CreditsPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()

  const [balance, setBalance] = useState(0)
  const [history, setHistory] = useState<LedgerEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login?callbackUrl=/credits')
    }
  }, [authStatus, router])

  useEffect(() => {
    async function fetchCredits() {
      if (authStatus !== 'authenticated') return

      try {
        const res = await fetch('/api/credits')
        const data = await res.json()
        setBalance(data.balance || 0)
        setHistory(data.history || [])
      } catch (error) {
        console.error('Failed to fetch credits:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCredits()
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
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Credits</h1>

        {/* Balance card */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Current balance</p>
              <p className="text-4xl font-bold text-gray-900">{balance}</p>
              <p className="text-sm text-gray-500 mt-1">credits</p>
            </div>
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center">
              <Coins className="w-8 h-8 text-primary" />
            </div>
          </div>
        </Card>

        {/* Credit info */}
        <Card className="p-6 mb-8 bg-primary-50 border-primary-100">
          <h2 className="font-semibold text-primary-900 mb-2">How credits work</h2>
          <ul className="text-sm text-primary-700 space-y-1">
            <li>• 1 credit = 1 night in a private room</li>
            <li>• 2 credits = 1 night in an entire place</li>
            <li>• Earn credits by hosting travelers</li>
            <li>• Spend credits to book stays</li>
          </ul>
        </Card>

        {/* History */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Transaction history</h2>

          {history.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No transactions yet</p>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => {
                const typeInfo = typeLabels[entry.type] || {
                  label: entry.type,
                  color: 'default',
                }
                const isPositive = entry.amount > 0

                return (
                  <div
                    key={entry.id}
                    className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-0"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isPositive ? 'bg-green-100' : 'bg-red-100'
                      }`}
                    >
                      {isPositive ? (
                        <ArrowDownLeft className="w-5 h-5 text-green-600" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{typeInfo.label}</p>
                        <Badge variant={typeInfo.color as 'default' | 'primary' | 'success' | 'warning' | 'error'}>
                          {isPositive ? '+' : ''}
                          {entry.amount}
                        </Badge>
                      </div>
                      {entry.note && (
                        <p className="text-sm text-gray-500 truncate">{entry.note}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        {formatDate(entry.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}
