'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useListingStore } from '@/stores/listing-store'
import { Upload, X, ImageIcon, ArrowUp, ArrowDown, Star } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  onBack: () => void
  onSubmit: () => void
  isSubmitting: boolean
}

function ImageThumbnail({ file, index, total, onRemove, onMoveUp, onMoveDown }: {
  file: File
  index: number
  total: number
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  return (
    <div className="group relative aspect-square rounded-2xl overflow-hidden border-2 border-border-light bg-muted-bg shadow-sm">
      {url ? (
        <img src={url} alt={file.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-text-muted" />
        </div>
      )}

      {/* Overlay controls on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {/* Delete button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-danger hover:text-white transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Reorder arrows */}
        <div className="absolute bottom-2 left-2 flex gap-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onMoveUp() }}
            disabled={index === 0}
            className="w-6 h-6 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center disabled:opacity-30 hover:bg-white transition-all"
          >
            <ArrowUp className="w-3 h-3 text-navy" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onMoveDown() }}
            disabled={index === total - 1}
            className="w-6 h-6 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center disabled:opacity-30 hover:bg-white transition-all"
          >
            <ArrowDown className="w-3 h-3 text-navy" />
          </button>
        </div>
      </div>

      {/* Primary badge */}
      {index === 0 && (
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-coral text-white text-[10px] font-bold rounded-full flex items-center gap-1 shadow-md">
          <Star className="w-2.5 h-2.5 fill-white" /> Primary
        </div>
      )}

      {/* File name */}
      <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-full text-[10px] text-white font-medium">
        {(file.size / 1024 / 1024).toFixed(1)} MB
      </div>
    </div>
  )
}

export function ImagesStep({ onBack, onSubmit, isSubmitting }: Props) {
  const store = useListingStore()
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList | File[]) => {
    const currentCount = store.images.length
    const incomingFiles = Array.from(files)
    
    if (currentCount + incomingFiles.length > 8) {
      toast.error('You can only upload up to 8 images')
      return
    }

    const validFiles = incomingFiles.filter(file => {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error(`${file.name} is not a valid image`)
        return false
      }
      return true
    })

    store.setImages([...store.images, ...validFiles])
  }

  const removeImage = (index: number) => {
    const newImages = [...store.images]
    newImages.splice(index, 1)
    store.setImages(newImages)
  }

  const moveImage = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === store.images.length - 1) return
    
    const newImages = [...store.images]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    const temp = newImages[index]
    newImages[index] = newImages[swapIndex]
    newImages[swapIndex] = temp
    store.setImages(newImages)
  }

  return (
    <div className="bg-white rounded-3xl border border-border-light shadow-lg shadow-navy/[0.03] p-6 sm:p-8 space-y-8">

      {/* Section: Upload */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-coral/10 flex items-center justify-center">
            <ImageIcon className="w-3.5 h-3.5 text-coral" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-navy">Property Photos</h2>
            <p className="text-xs text-text-muted">Add up to 8 clear photos of the property</p>
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragActive(false)
            handleFiles(e.dataTransfer.files)
          }}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 ${
            dragActive 
              ? 'border-coral bg-coral/[0.04]' 
              : 'border-border-light hover:border-coral/40 hover:bg-muted-bg'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />
          <div className="w-14 h-14 rounded-2xl bg-coral/10 flex items-center justify-center mx-auto mb-3">
            <Upload className="w-7 h-7 text-coral" />
          </div>
          <p className="font-semibold text-navy">Click or drag photos here</p>
          <p className="text-sm text-text-muted mt-1">JPEG, PNG, or WebP only</p>
        </div>
      </div>

      {/* Section: Preview Grid */}
      {store.images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-coral/10 flex items-center justify-center">
                <ImageIcon className="w-3.5 h-3.5 text-coral" />
              </div>
              <h2 className="text-lg font-bold text-navy">Selected Photos</h2>
            </div>
            <span className="text-xs font-semibold text-text-muted bg-muted-bg px-2.5 py-1 rounded-full">
              {store.images.length}/8
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {store.images.map((file, i) => (
              <ImageThumbnail
                key={`${file.name}-${i}`}
                file={file}
                index={i}
                total={store.images.length}
                onRemove={() => removeImage(i)}
                onMoveUp={() => moveImage(i, 'up')}
                onMoveDown={() => moveImage(i, 'down')}
              />
            ))}
          </div>

          <p className="text-xs text-text-muted text-center">
            Hover over an image to reorder or remove. The first photo will be the primary cover image.
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="text-sm font-semibold text-text-muted hover:text-navy transition-colors px-2 disabled:opacity-50"
        >
          ← Back
        </button>
        <Button 
          onClick={onSubmit} 
          disabled={store.images.length === 0 || isSubmitting}
          className="flex-1 h-12 bg-coral hover:bg-coral-dark text-white font-semibold text-base rounded-2xl shadow-md shadow-coral/20 transition-all hover:shadow-lg hover:shadow-coral/25 active:scale-[0.98] disabled:active:scale-100"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Publishing...
            </span>
          ) : (
            'Publish Listing →'
          )}
        </Button>
      </div>
    </div>
  )
}
