'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useListingStore } from '@/stores/listing-store'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import imageCompression from 'browser-image-compression'
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
        gender_allowed: store.gender_allowed,
        roommates_needed: store.roommates_needed,
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

  return (
    <div className="min-h-screen bg-muted-bg py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-navy mb-6">List a Property</h1>
        
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm font-medium text-text-muted mb-2">
            <span>Step {step} of {totalSteps}</span>
            <span>{['Basic Info', 'Amenities', 'Location', 'Images'][step - 1]}</span>
          </div>
          <div className="h-2 bg-border-light rounded-full overflow-hidden">
            <div 
              className="h-full bg-coral transition-all duration-300 ease-out"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <div className={`transition-all duration-200 ease-out ${
          isTransitioning ? 'opacity-0 translate-x-5' : 'opacity-100 translate-x-0'
        }`}>
          {steps[step - 1]}
        </div>
      </div>
    </div>
  )
}
