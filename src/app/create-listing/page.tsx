'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useListingStore } from '@/stores/listing-store'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import imageCompression from 'browser-image-compression'
import { EmptyState } from '@/components/empty-state'
import { BasicInfoStep } from './steps/basic-info'
import { AmenitiesStep } from './steps/amenities'
import { LocationStep } from './steps/location'
import { ImagesStep } from './steps/images'

export default function CreateListingPage() {
  const router = useRouter()
  const store = useListingStore()
  const [step, setStep] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please log in first')
        router.push('/')
        return
      }
      const { data } = await supabase.from('profiles').select('verified_status').eq('id', user.id).single()
      setIsVerified(data?.verified_status === 'VERIFIED')
      setIsCheckingAuth(false)
    }
    checkAuth()
  }, [router])

  const goToStep = (targetStep: number) => {
    setIsTransitioning(true)
    setTimeout(() => {
      setStep(targetStep)
      setIsTransitioning(false)
    }, 200)
  }

  const handleSubmit = async () => {
    if (store.images.length === 0) {
      toast.error('Please add at least one image')
      return
    }
    
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('Authentication error. Please log in again.')
        return
      }

      const uploadPromises = store.images.map(async (file, index) => {
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
          fileType: 'image/webp',
        })

        const timestamp = Date.now()
        const path = `${user.id}/${timestamp}-${index}.webp`

        const { error } = await supabase.storage
          .from('listings')
          .upload(path, compressedFile, { contentType: 'image/webp' })

        if (error) throw error

        const { data: { publicUrl } } = supabase.storage
          .from('listings')
          .getPublicUrl(path)

        return {
          url: publicUrl,
          order: index,
          is_primary: index === 0,
        }
      })

      const uploadedImages = await Promise.all(uploadPromises)

      const payload = {
        title: store.title,
        description: store.description,
        rent: Number(store.rent),
        deposit: Number(store.deposit),
        room_type: store.room_type,
        furnished: store.furnished,
        roommates_needed: store.roommates_needed,
        persons_staying: store.persons_staying,
        owner_proximity: store.owner_proximity,
        has_balcony: store.has_balcony,
        has_wifi: store.has_wifi,
        has_ac: store.has_ac,
        food_available: store.food_available,
        water_supply: store.water_supply,
        latitude: store.latitude,
        longitude: store.longitude,
        address: store.address,
        available_from: store.available_from || undefined,
        images: uploadedImages,
      }

      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create listing')
      }

      toast.success('Listing created successfully!')
      store.reset()
      router.push('/my-listings')
    } catch (err: unknown) {
      console.error(err)
      toast.error((err as Error).message || 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps = [
    <BasicInfoStep key="1" onNext={() => goToStep(2)} />,
    <AmenitiesStep key="2" onNext={() => goToStep(3)} onBack={() => goToStep(1)} />,
    <LocationStep key="3" onNext={() => goToStep(4)} onBack={() => goToStep(2)} />,
    <ImagesStep 
      key="4" 
      onBack={() => goToStep(3)} 
      onSubmit={handleSubmit} 
      isSubmitting={isSubmitting} 
    />,
  ]

  const totalSteps = steps.length

  if (isCheckingAuth) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-muted-bg">
        <div className="w-8 h-8 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
      </div>
    )
  }

  if (isVerified === false) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-muted-bg p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-sm border border-border-light">
          <EmptyState
            icon="listings"
            title="Verification Required"
            description="Only verified NFSU students can post property listings to keep our community safe. Please complete your ID verification first."
            actionLabel="Verify Profile"
            onAction={() => router.push('/profile')}
          />
        </div>
      </div>
    )
  }

  const stepMeta = [
    { label: 'Basic Info', icon: 'Home', desc: 'Tell us about the property' },
    { label: 'Amenities', icon: 'Wifi', desc: 'What\'s included?' },
    { label: 'Location', icon: 'MapPin', desc: 'Pin it on the map' },
    { label: 'Photos', icon: 'Image', desc: 'Show it off' },
  ]

  return (
    <div className="min-h-screen bg-muted-bg pb-16">
      {/* Warm gradient band at top */}
      <div className="bg-gradient-to-b from-navy/5 via-navy/[0.02] to-transparent pt-10 pb-6 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-coral/10 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-coral"><path d="M3 9.5 12 3l9 6.5"/><path d="M5 20V11l7-5 7 5v9"/><path d="M10 20v-6h4v6"/></svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-navy">List a Property</h1>
              <p className="text-sm text-text-muted">Share your space with the NFSU community</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-8">
          {stepMeta.map((s, i) => {
            const stepNum = i + 1
            const isDone = stepNum < step
            const isCurrent = stepNum === step
            const isFuture = stepNum > step

            return (
              <div key={s.label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    isDone
                      ? 'bg-coral text-white shadow-md shadow-coral/25'
                      : isCurrent
                      ? 'bg-white border-2 border-coral text-coral shadow-md shadow-coral/20 ring-4 ring-coral/10'
                      : 'bg-white border-2 border-border-light text-text-muted'
                  }`}>
                    {isDone ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                    ) : (
                      stepNum
                    )}
                  </div>
                  <span className={`text-[11px] font-semibold mt-2 whitespace-nowrap transition-colors ${
                    isCurrent ? 'text-coral' : isDone ? 'text-navy' : 'text-text-muted'
                  }`}>
                    {s.label}
                  </span>
                </div>

                {i < stepMeta.length - 1 && (
                  <div className="flex-1 h-[2px] mx-2 mt-[-18px] rounded-full transition-colors duration-300"
                    style={{ backgroundColor: isDone ? '#E8593C' : '#E2E8F0' }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Step content */}
        <div className={`transition-all duration-300 ease-out ${
          isTransitioning ? 'opacity-0 translate-x-5' : 'opacity-100 translate-x-0'
        }`}>
          {steps[step - 1]}
        </div>
      </div>
    </div>
  )
}
