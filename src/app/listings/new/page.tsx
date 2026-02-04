'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/layout/Navbar'
import { Button, Input, Textarea, Select, Card } from '@/components/ui'
import { config } from '@/lib/config'
import { Camera, X, ImagePlus } from 'lucide-react'

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

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_PHOTOS = 10

export default function NewListingPage() {
  const router = useRouter()
  const { status } = useSession()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [photos, setPhotos] = useState<string[]>([])

  const [formData, setFormData] = useState({
    title: '',
    city: '',
    neighborhood: '',
    fullAddress: '',
    spaceType: 'ENTIRE_PLACE' as 'ROOM' | 'ENTIRE_PLACE',
    creditsPerNight: 2,
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

  const goToStep = (newStep: number) => {
    setError('')
    setStep(newStep)
  }

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const maxSize = 1200
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width
              width = maxSize
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height
              height = maxSize
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)

          const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
          resolve(dataUrl)
        }
        img.onerror = reject
        img.src = e.target?.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setError('')

    for (const file of files) {
      if (photos.length >= MAX_PHOTOS) {
        setError(`Maximum ${MAX_PHOTOS} photos allowed`)
        break
      }

      if (file.size > MAX_FILE_SIZE) {
        setError('Photos must be under 5MB each')
        continue
      }

      if (!file.type.startsWith('image/')) {
        setError('Please select only image files')
        continue
      }

      try {
        const compressed = await compressImage(file)
        setPhotos((prev) => [...prev, compressed])
      } catch {
        setError('Failed to process image')
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    setError('')
    setLoading(true)

    if (status !== 'authenticated') {
      router.push('/login?callbackUrl=/listings/new')
      return
    }

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, photos }),
      })

      const data = await res.json()

      if (res.status === 401) {
        router.push('/login?callbackUrl=/listings/new')
        return
      }

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        return
      }

      router.push(`/listings/${data.listing.id}`)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const totalSteps = 5

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
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full transition-colors ${
                s <= step ? 'bg-primary' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <Card className="p-6 sm:p-8">
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

              <Select
                label="Max guests"
                value={formData.maxGuests.toString()}
                onChange={(e) =>
                  setFormData({ ...formData, maxGuests: parseInt(e.target.value) })
                }
                options={[
                  { value: '1', label: '1 guest' },
                  { value: '2', label: '2 guests' },
                  { value: '3', label: '3 guests' },
                ]}
              />

              <div className="flex justify-end">
                <Button onClick={() => goToStep(2)} disabled={!formData.title}>
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
                <Button variant="outline" onClick={() => goToStep(1)}>
                  Back
                </Button>
                <Button
                  onClick={() => goToStep(3)}
                  disabled={!formData.city || !formData.fullAddress}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Photos</h2>
              <p className="text-sm text-gray-500 -mt-4">
                Add photos to help guests see your space (optional but recommended)
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoSelect}
                className="hidden"
              />

              {/* Photo grid */}
              <div className="grid grid-cols-3 gap-3">
                {photos.map((photo, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {photos.length < MAX_PHOTOS && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary-50 transition-colors"
                  >
                    <ImagePlus className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-500">Add photo</span>
                  </button>
                )}
              </div>

              {photos.length === 0 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary hover:bg-primary-50 transition-colors"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Camera className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-700">Add photos</p>
                    <p className="text-sm text-gray-500">Tap to select from your camera roll</p>
                  </div>
                </button>
              )}

              <p className="text-xs text-gray-400 text-center">
                Max {MAX_PHOTOS} photos, 5MB each
              </p>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => goToStep(2)}>
                  Back
                </Button>
                <Button onClick={() => goToStep(4)}>
                  {photos.length > 0 ? 'Continue' : 'Skip for now'}
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
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
                <Button variant="outline" onClick={() => goToStep(3)}>
                  Back
                </Button>
                <Button onClick={() => goToStep(5)}>Continue</Button>
              </div>
            </div>
          )}

          {step === 5 && (
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
                  <span className="text-sm text-gray-500">1</span>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={1}
                    value={formData.creditsPerNight}
                    onChange={(e) =>
                      setFormData({ ...formData, creditsPerNight: parseInt(e.target.value) })
                    }
                    className="flex-1 accent-primary"
                  />
                  <span className="text-sm text-gray-500">3</span>
                </div>
                <div className="flex items-center justify-center mt-2">
                  <span className="px-3 py-1 bg-primary-50 text-primary font-semibold rounded-full">
                    {formData.creditsPerNight} credit{formData.creditsPerNight > 1 ? 's' : ''}/night
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Default for entire places is 2 credits. Most hosts choose this.
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
                <Button variant="outline" onClick={() => goToStep(4)}>
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
