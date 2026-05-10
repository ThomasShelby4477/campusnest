'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Phone, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  listingId: string
  isVerified: boolean
  isLoggedIn: boolean
}

export function ListingContactButton({ listingId, isVerified, isLoggedIn }: Props) {
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleReveal = async () => {
    if (!isLoggedIn) {
      toast.error('Please log in to contact the poster')
      return
    }
    if (!isVerified) {
      toast.error('Only verified users can view contact details')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/listings/${listingId}/contact`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPhone(data.phone)
      setOpen(true)
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to reveal contact')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button 
        className="w-full h-12 bg-coral hover:bg-coral-dark text-white font-semibold text-base"
        onClick={handleReveal}
        disabled={loading}
      >
        {loading ? 'Revealing...' : 'Contact Poster'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Details</DialogTitle>
            <DialogDescription>
              Reach out directly to schedule a viewing or ask questions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center p-6 bg-muted-bg rounded-xl border border-border-light my-4">
            <div className="w-12 h-12 bg-navy/10 rounded-full flex items-center justify-center mb-3">
              <Phone className="w-6 h-6 text-navy" />
            </div>
            <p className="text-2xl font-bold tracking-wider text-text-primary mb-1">
              {phone}
            </p>
            <p className="text-sm text-text-muted">Verified Phone Number</p>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 border-navy text-navy hover:bg-navy/5"
              onClick={() => window.location.href = `tel:${phone}`}
            >
              Call Now
            </Button>
            <Button 
              className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white"
              onClick={() => window.open(`https://wa.me/${phone?.replace('+', '')}`, '_blank')}
            >
              WhatsApp <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
