'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/layout/Navbar'
import { Button, Input, Textarea, Select, Card } from '@/components/ui'
import { config } from '@/lib/config'

const amenitiesOptions = [
  { key: 'wifi', label: 'WiFi' },
  { key: 'kitchen', label: 'Kitchen' },
  { key: 'workspace', label: 'Dedicated workspace' },
  { key: 'washer', label: 'Washer' },
  { key: 'dryer', label: 'Dryer' },
  { key: 'parking', label: 'Free parking' },
  { key: 'ac', label: 'Air conditioning' },
  { key: 'heating', label: 'Heating' },
  { key: 'tv', label: 'TV' },
  { key: 'pool', label: 'Pool' },
  { key: 'gym', label: 'Gym' },
  { key: 'pets', label: 'Pet friendly' },
]

export default function NewListingPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    city: '',
    neighborhood: '',
    fullAddress: '',
    spaceType: 'ROOM' as 'ROOM' | 'ENTIRE_PLACE',
    creditsPerNight: 1,
    maxGuests: 1,
    amenities: [] as string[],
    houseRules: '',
    keyAccessMethod: 'SMART_LOCK' as string,
    keyInstructions: '',
    safetyAck: false,
  })

  if (status === 'loading') {
    return null
  }

  if (status === 'unauthenticated') {
    router.push('/login?callbackUrl=/listings/new')
    return null
  }

  const toggleAmenity = (key: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(key)
        ? prev.amenities.filter((a) => a !== key)
        : [...prev.amenities, key],
    }))
  }

  const handleSubmit = async () => {
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        return
      }

      router.push(`/listings/${data.listing.id}`)
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const defaultCredits = config.defaultCredits[formData.spaceType]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">List your space</h1>
          <p className="text-gray-600 mt-1">
            Share your space with travelers and earn credits
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full transition-colors ${
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
              <h2 className="text-lg font-semibold text-gray-900">Basic details</h2>

              <Input
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Cozy studio in downtown"
                required
              />

              <Select
                label="Space type"
                value={formData.spaceType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    spaceType: e.target.value as 'ROOM' | 'ENTIRE_PLACE',
                    creditsPerNight: config.defaultCredits[e.target.value as 'ROOM' | 'ENTIRE_PLACE'],
                  })
                }
                options={[
                  { value: 'ROOM', label: 'Private room' },
                  { value: 'ENTIRE_PLACE', label: 'Entire place' },
                ]}
              />

              <Input
                label="Max guests"
                type="number"
                min={1}
                max={20}
                value={formData.maxGuests}
                onChange={(e) =>
                  setFormData({ ...formData, maxGuests: parseInt(e.target.value) || 1 })
                }
              />

              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} disabled={!formData.title}>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Location</h2>

              <Input
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="San Francisco"
                required
              />

              <Input
                label="Neighborhood (optional)"
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                placeholder="Mission District"
              />

              <Input
                label="Full address"
                value={formData.fullAddress}
                onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
                placeholder="123 Main St, Apt 4B"
                required
              />
              <p className="text-sm text-gray-500 -mt-4">
                This will only be shown to confirmed guests
              </p>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!formData.city || !formData.fullAddress}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Amenities & rules</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Amenities
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {amenitiesOptions.map((amenity) => (
                    <label
                      key={amenity.key}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.amenities.includes(amenity.key)
                          ? 'border-primary bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.amenities.includes(amenity.key)}
                        onChange={() => toggleAmenity(amenity.key)}
                        className="sr-only"
                      />
                      <span
                        className={`w-5 h-5 rounded border flex items-center justify-center ${
                          formData.amenities.includes(amenity.key)
                            ? 'bg-primary border-primary text-white'
                            : 'border-gray-300'
                        }`}
                      >
                        {formData.amenities.includes(amenity.key) && (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 12 12">
                            <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                          </svg>
                        )}
                      </span>
                      <span className="text-gray-700">{amenity.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Textarea
                label="House rules (optional)"
                value={formData.houseRules}
                onChange={(e) => setFormData({ ...formData, houseRules: e.target.value })}
                placeholder="No smoking, quiet hours after 10pm..."
                rows={4}
              />

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button onClick={() => setStep(4)}>Continue</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Access & pricing</h2>

              <Select
                label="Key access method"
                value={formData.keyAccessMethod}
                onChange={(e) => setFormData({ ...formData, keyAccessMethod: e.target.value })}
                options={[
                  { value: 'SMART_LOCK', label: 'Smart lock / keypad' },
                  { value: 'LOCKBOX', label: 'Lockbox' },
                  { value: 'IN_PERSON', label: 'In-person handoff' },
                  { value: 'DOORMAN', label: 'Doorman / building staff' },
                ]}
              />

              <Textarea
                label="Access instructions (optional)"
                value={formData.keyInstructions}
                onChange={(e) => setFormData({ ...formData, keyInstructions: e.target.value })}
                placeholder="Code is 1234. Enter through the side gate..."
                rows={3}
              />
              <p className="text-sm text-gray-500 -mt-4">
                Only shown to confirmed guests
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Credits per night
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={formData.creditsPerNight}
                    onChange={(e) =>
                      setFormData({ ...formData, creditsPerNight: parseInt(e.target.value) })
                    }
                    className="flex-1"
                  />
                  <span className="w-12 text-center font-semibold text-primary">
                    {formData.creditsPerNight}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Default for {formData.spaceType === 'ROOM' ? 'rooms' : 'entire places'} is{' '}
                  {defaultCredits} credit{defaultCredits > 1 ? 's' : ''}
                </p>
              </div>

              <label className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.safetyAck}
                  onChange={(e) => setFormData({ ...formData, safetyAck: e.target.checked })}
                  className="mt-1"
                />
                <div>
                  <span className="font-medium text-gray-900">Safety acknowledgment</span>
                  <p className="text-sm text-gray-500 mt-1">
                    I confirm that my listing complies with Verto&apos;s policies: no parties, no
                    weapons, and no illegal activity on the premises.
                  </p>
                </div>
              </label>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(3)}>
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={!formData.safetyAck}
                >
                  Create listing
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}
