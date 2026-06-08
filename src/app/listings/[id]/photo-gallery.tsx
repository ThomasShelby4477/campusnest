'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Grid2X2 } from 'lucide-react'

export function PhotoGallery({ images }: { images: { url: string }[] }) {
  const [open, setOpen] = useState(false)

  if (images.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          <Button variant="secondary" className="absolute bottom-4 right-4 z-10 flex items-center gap-2 bg-white/90 hover:bg-white text-navy font-semibold shadow-md" />
        }
      >
        <Grid2X2 className="w-4 h-4" />
        Show all photos
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 bg-black/95 border-none text-white [&>button]:text-white">
        <DialogTitle className="sr-only">Property Photos Gallery</DialogTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 mt-8">
          {images.map((img, i) => (
            <div key={i} className="relative aspect-video w-full rounded-xl overflow-hidden bg-white/5">
              <Image
                src={img.url}
                alt={`Property photo ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
