'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useListingStore } from '@/stores/listing-store'
import { Upload, X, Image as ImageIcon, GripVertical } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  onBack: () => void
  onSubmit: () => void
  isSubmitting: boolean
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

  // Simple move up/down (for drag handlers placeholder)
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
    <Card className="border-border-light shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Property Images</CardTitle>
        <CardDescription>Upload clear photos of the property (Max 8)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragActive(false)
            handleFiles(e.dataTransfer.files)
          }}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            dragActive ? 'border-navy bg-navy/5' : 'border-border-light hover:border-navy/40 hover:bg-muted-bg'
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
          <Upload className="w-10 h-10 text-text-muted mx-auto mb-2" />
          <p className="font-medium text-text-primary">Click or drag images here</p>
          <p className="text-sm text-text-muted mt-1">JPEG, PNG, WEBP · Max 5MB per image</p>
        </div>

        {store.images.length > 0 && (
          <div className="space-y-3">
            <Label>Selected Images ({store.images.length}/8)</Label>
            <div className="space-y-2">
              {store.images.map((file, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white border rounded-lg shadow-sm group">
                  <div className="flex flex-col gap-1 text-text-muted cursor-move">
                    <button type="button" onClick={() => moveImage(i, 'up')} disabled={i === 0} className="hover:text-navy disabled:opacity-30">▲</button>
                    <button type="button" onClick={() => moveImage(i, 'down')} disabled={i === store.images.length - 1} className="hover:text-navy disabled:opacity-30">▼</button>
                  </div>
                  
                  <div className="w-12 h-12 bg-muted-bg rounded-md flex items-center justify-center shrink-0">
                    <ImageIcon className="w-6 h-6 text-text-muted" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{file.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      {i === 0 && (
                        <span className="text-[10px] uppercase font-bold tracking-wider text-white bg-success px-1.5 py-0.5 rounded">Primary</span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting} className="flex-1">
            Back
          </Button>
          <Button 
            onClick={onSubmit} 
            disabled={store.images.length === 0 || isSubmitting}
            className="flex-1 bg-coral hover:bg-coral-dark text-white"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Publishing...
              </span>
            ) : (
              'Publish Listing'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
