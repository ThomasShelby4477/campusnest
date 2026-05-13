'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { HandHeart, Check, Clock, X, Send } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  listingId: string
  isLoggedIn: boolean
  isOwnListing: boolean
}

export function ListingContactButton({ listingId, isLoggedIn, isOwnListing }: Props) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [requestStatus, setRequestStatus] = useState<string | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(true)

  useEffect(() => {
    if (!isLoggedIn || isOwnListing) {
      setCheckingStatus(false)
      return
    }
    // Check if user already sent interest
    fetch(`/api/listings/${listingId}/interest`)
      .then(r => r.json())
      .then(d => setRequestStatus(d.status))
      .catch(() => {})
      .finally(() => setCheckingStatus(false))
  }, [listingId, isLoggedIn, isOwnListing])

  const handleSendInterest = async () => {
    if (!isLoggedIn) {
      toast.error('Please log in to show interest')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/listings/${listingId}/interest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() }),
      })
      const data = await res.json()

      if (res.status === 409) {
        setRequestStatus(data.status || 'PENDING')
        toast.info(data.message)
        setOpen(false)
        return
      }

      if (!res.ok) throw new Error(data.error)

      setRequestStatus('PENDING')
      setOpen(false)
      toast.success('Interest sent! The poster will review your profile and respond.')
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to send interest')
    } finally {
      setLoading(false)
    }
  }

  if (isOwnListing) return null

  if (checkingStatus) {
    return (
      <Button className="w-full h-12" disabled>
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
        Loading...
      </Button>
    )
  }

  // Already sent — show status
  if (requestStatus === 'PENDING') {
    return (
      <div className="w-full space-y-2">
        <Button className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-semibold cursor-default" disabled>
          <Clock className="w-4 h-4 mr-2" /> Interest Sent — Awaiting Response
        </Button>
        <p className="text-xs text-center text-text-muted">
          The poster will review your profile and respond soon.
        </p>
      </div>
    )
  }

  if (requestStatus === 'ACCEPTED') {
    return (
      <div className="w-full space-y-2">
        <Button className="w-full h-12 bg-success hover:bg-success/90 text-white font-semibold cursor-default" disabled>
          <Check className="w-4 h-4 mr-2" /> Interest Accepted!
        </Button>
        <p className="text-xs text-center text-text-muted">
          Check your notifications to start chatting.
        </p>
      </div>
    )
  }

  if (requestStatus === 'DECLINED') {
    return (
      <div className="w-full space-y-2">
        <Button className="w-full h-12 bg-muted-bg text-text-muted font-semibold cursor-default" disabled>
          <X className="w-4 h-4 mr-2" /> Interest Declined
        </Button>
        <p className="text-xs text-center text-text-muted">
          The poster has declined your request at this time.
        </p>
      </div>
    )
  }

  // Default — show interest button
  return (
    <>
      <Button 
        className="w-full h-12 bg-coral hover:bg-coral-dark text-white font-semibold text-base"
        onClick={() => {
          if (!isLoggedIn) {
            toast.error('Please log in to show interest')
            return
          }
          setOpen(true)
        }}
      >
        <HandHeart className="w-5 h-5 mr-2" /> Show Interest
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HandHeart className="w-5 h-5 text-coral" /> Show Interest
            </DialogTitle>
            <DialogDescription>
              The poster will be notified and can view your verified profile. If they accept,
              a private chat will be opened between you.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="bg-muted-bg rounded-xl p-4 border border-border-light space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                <span className="w-6 h-6 bg-navy/10 rounded-full flex items-center justify-center text-xs font-bold text-navy">1</span>
                You send interest
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                <span className="w-6 h-6 bg-navy/10 rounded-full flex items-center justify-center text-xs font-bold text-navy">2</span>
                Poster reviews your profile
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                <span className="w-6 h-6 bg-navy/10 rounded-full flex items-center justify-center text-xs font-bold text-navy">3</span>
                If accepted, a chat opens
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-text-primary mb-1.5 block">
                Add a message <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Hi, I'm interested in this property. I'm a 3rd year student at NFSU..."
                className="w-full bg-white border border-border-light rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-navy resize-none h-20"
                maxLength={500}
              />
              <p className="text-xs text-text-muted text-right mt-1">{message.length}/500</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-coral hover:bg-coral-dark text-white"
              onClick={handleSendInterest}
              disabled={loading}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" /> Send Interest
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
