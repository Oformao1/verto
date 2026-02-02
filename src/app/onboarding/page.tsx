'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button, Input, Textarea, Select, Card } from '@/components/ui'
import { UserMode } from '@prisma/client'

export default function OnboardingPage() {
  const router = useRouter()
  const { update } = useSession()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    city: '',
    workIndustry: '',
    socialsLink: '',
    modeInterest: 'SWAPPER' as UserMode,
  })

  const handleSubmit = async () => {
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Something went wrong')
        return
      }

      await update()
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-xl">V</span>
          </div>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Complete your profile</h1>
          <p className="mt-2 text-gray-600">
            Tell us about yourself so hosts and guests can get to know you
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full transition-colors ${
                s <= step ? 'bg-primary' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <Card className="p-8">
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Basic info</h2>

              <Input
                label="Full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                required
              />

              <Textarea
                label="Bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell hosts and guests about yourself..."
                rows={4}
                required
              />

              <Input
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="San Francisco, CA"
              />

              <div className="flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!formData.name || !formData.bio}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Work & socials</h2>

              <Input
                label="Work / Industry (optional)"
                value={formData.workIndustry}
                onChange={(e) => setFormData({ ...formData, workIndustry: e.target.value })}
                placeholder="Software Engineer at Acme Inc"
              />

              <Input
                label="Social link (optional)"
                value={formData.socialsLink}
                onChange={(e) => setFormData({ ...formData, socialsLink: e.target.value })}
                placeholder="https://linkedin.com/in/yourprofile"
              />

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setStep(3)}>Continue</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">How will you use Verto?</h2>

              <Select
                label="I'm interested in..."
                value={formData.modeInterest}
                onChange={(e) =>
                  setFormData({ ...formData, modeInterest: e.target.value as UserMode })
                }
                options={[
                  { value: 'GUEST', label: 'Finding stays (Guest)' },
                  { value: 'HOST', label: 'Hosting travelers (Host)' },
                  { value: 'SWAPPER', label: 'Both - swapping stays (Swapper)' },
                ]}
              />

              <p className="text-sm text-gray-500">
                You can always change this later. Swappers can both host and request stays.
              </p>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button onClick={handleSubmit} loading={loading}>
                  Complete setup
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
