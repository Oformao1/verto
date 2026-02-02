'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Button, Card, Badge, Input, Textarea, Modal, Spinner } from '@/components/ui'
import { Shield, Users, AlertTriangle, Coins } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { getTierBadge } from '@/lib/tiers'

interface Report {
  id: string
  targetType: string
  targetId: string
  category: string
  details: string | null
  status: string
  createdAt: string
  reporter: {
    id: string
    name: string
    email: string
  }
}

interface User {
  id: string
  email: string
  name: string | null
  city: string | null
  createdAt: string
  tier: number
  _count: {
    listings: number
    bookingsAsGuest: number
    bookingsAsHost: number
    vouchesReceived: number
  }
}

export default function AdminPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()

  const [tab, setTab] = useState<'reports' | 'users'>('reports')
  const [reports, setReports] = useState<Report[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Credit adjustment modal
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [creditAmount, setCreditAmount] = useState('')
  const [creditNote, setCreditNote] = useState('')
  const [creditLoading, setCreditLoading] = useState(false)

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login')
    }
  }, [authStatus, router])

  useEffect(() => {
    async function fetchData() {
      if (authStatus !== 'authenticated') return

      try {
        const [reportsRes, usersRes] = await Promise.all([
          fetch('/api/admin?resource=reports'),
          fetch('/api/admin?resource=users'),
        ])

        if (!reportsRes.ok || !usersRes.ok) {
          setError('Access denied. Admin privileges required.')
          return
        }

        const [reportsData, usersData] = await Promise.all([
          reportsRes.json(),
          usersRes.json(),
        ])

        setReports(reportsData.reports || [])
        setUsers(usersData.users || [])
      } catch (err) {
        setError('Failed to load admin data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [authStatus])

  const handleResolveReport = async (reportId: string, status: 'RESOLVED' | 'DISMISSED') => {
    try {
      await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolveReport',
          reportId,
          status,
        }),
      })

      setReports(reports.map((r) => (r.id === reportId ? { ...r, status } : r)))
    } catch (err) {
      console.error('Failed to resolve report:', err)
    }
  }

  const handleAdjustCredits = async () => {
    if (!selectedUser || !creditAmount || !creditNote) return

    setCreditLoading(true)
    try {
      await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adjustCredits',
          userId: selectedUser.id,
          amount: parseInt(creditAmount),
          note: creditNote,
        }),
      })

      setShowCreditModal(false)
      setCreditAmount('')
      setCreditNote('')
      setSelectedUser(null)
    } catch (err) {
      console.error('Failed to adjust credits:', err)
    } finally {
      setCreditLoading(false)
    }
  }

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="p-8 text-center">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-500">{error}</p>
          </Card>
        </div>
      </div>
    )
  }

  const pendingReports = reports.filter((r) => r.status === 'PENDING')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingReports.length}</p>
                <p className="text-sm text-gray-500">Pending reports</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                <p className="text-sm text-gray-500">Total users</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Coins className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {users.reduce((acc, u) => acc + u._count.listings, 0)}
                </p>
                <p className="text-sm text-gray-500">Total listings</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setTab('reports')}
            className={`pb-4 px-1 font-medium transition-colors ${
              tab === 'reports'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Reports ({reports.length})
          </button>
          <button
            onClick={() => setTab('users')}
            className={`pb-4 px-1 font-medium transition-colors ${
              tab === 'users'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Users ({users.length})
          </button>
        </div>

        {/* Content */}
        {tab === 'reports' ? (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Reporter
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td className="px-4 py-3">
                        <Badge>{report.targetType}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{report.category}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{report.reporter.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(report.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            report.status === 'PENDING'
                              ? 'warning'
                              : report.status === 'RESOLVED'
                              ? 'success'
                              : 'default'
                          }
                        >
                          {report.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {report.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleResolveReport(report.id, 'RESOLVED')}
                            >
                              Resolve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolveReport(report.id, 'DISMISSED')}
                            >
                              Dismiss
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tier
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Listings
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Bookings
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Vouches
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Joined
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => {
                    const tierBadge = getTierBadge(user.tier)
                    return (
                      <tr key={user.id}>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">{user.name || 'Unnamed'}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={tierBadge.color}>{tierBadge.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {user._count.listings}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {user._count.bookingsAsGuest + user._count.bookingsAsHost}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {user._count.vouchesReceived}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user)
                              setShowCreditModal(true)
                            }}
                          >
                            <Coins className="w-4 h-4 mr-1" />
                            Adjust
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </main>

      {/* Credit adjustment modal */}
      <Modal
        isOpen={showCreditModal}
        onClose={() => {
          setShowCreditModal(false)
          setSelectedUser(null)
          setCreditAmount('')
          setCreditNote('')
        }}
        title="Adjust credits"
      >
        {selectedUser && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Adjust credits for <strong>{selectedUser.name || selectedUser.email}</strong>
            </p>

            <Input
              label="Amount"
              type="number"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              placeholder="Positive to add, negative to remove"
            />

            <Textarea
              label="Note (required)"
              value={creditNote}
              onChange={(e) => setCreditNote(e.target.value)}
              placeholder="Reason for adjustment..."
              rows={3}
            />

            <Button
              className="w-full"
              onClick={handleAdjustCredits}
              loading={creditLoading}
              disabled={!creditAmount || !creditNote}
            >
              Confirm adjustment
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
