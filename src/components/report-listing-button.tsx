'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Flag, X, ChevronRight, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ReportReason = 'FAKE_LISTING' | 'SCAM' | 'HARASSMENT' | 'SPAM' | 'DISCRIMINATION' | 'OTHER'

const REASONS: { value: ReportReason; label: string; desc: string }[] = [
  { value: 'FAKE_LISTING',    label: 'Fake Listing',     desc: 'Property does not exist or photos are stolen' },
  { value: 'SCAM',            label: 'Scam / Fraud',     desc: 'Asking for advance money or suspicious behaviour' },
  { value: 'HARASSMENT',      label: 'Harassment',       desc: 'Abusive, threatening or offensive communication' },
  { value: 'SPAM',            label: 'Spam',             desc: 'Duplicate listing or irrelevant content' },
  { value: 'DISCRIMINATION',  label: 'Discrimination',   desc: 'Illegal discrimination based on gender, religion etc.' },
  { value: 'OTHER',           label: 'Other',            desc: 'Something else not listed above' },
]

interface Props {
  listingId: string
  isLoggedIn: boolean
}

export function ReportListingButton({ listingId, isLoggedIn }: Props) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'pick' | 'detail' | 'done'>('pick')
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleOpen = () => {
    if (!isLoggedIn) {
      toast.error('Please log in to report a listing')
      return
    }
    setOpen(true)
    setStep('pick')
    setReason(null)
    setDescription('')
  }

  const handleSubmit = async () => {
    if (!reason) return
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error('Please log in'); return }

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: 'LISTING',
          target_id: listingId,
          reason,
          description: description.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit report')
      }

      setStep('done')
    } catch (err: unknown) {
      toast.error((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Trigger button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full text-text-muted hover:text-danger hover:border-danger/40 transition-colors"
        onClick={handleOpen}
      >
        <Flag className="w-3.5 h-3.5 mr-1.5" />
        Report this listing
      </Button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={() => setOpen(false)}
        >
          {/* Modal card */}
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-danger" />
                </div>
                <h2 className="font-bold text-navy text-base">Report Listing</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full bg-muted-bg hover:bg-border-light flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5 text-text-muted" />
              </button>
            </div>

            {/* Step: pick reason */}
            {step === 'pick' && (
              <div className="p-5 space-y-2">
                <p className="text-sm text-text-muted mb-3">Why are you reporting this listing?</p>
                {REASONS.map(r => (
                  <button
                    key={r.value}
                    onClick={() => { setReason(r.value); setStep('detail') }}
                    className="w-full text-left flex items-center justify-between p-3.5 rounded-xl border border-border-light hover:border-coral hover:bg-coral/[0.04] transition-all group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-navy group-hover:text-coral transition-colors">{r.label}</p>
                      <p className="text-xs text-text-muted mt-0.5">{r.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* Step: add detail */}
            {step === 'detail' && (
              <div className="p-5 space-y-4">
                <button
                  onClick={() => setStep('pick')}
                  className="flex items-center gap-1 text-xs text-text-muted hover:text-navy transition-colors"
                >
                  ← Change reason
                </button>

                {/* Selected reason pill */}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-danger/5 border border-danger/20">
                  <Flag className="w-4 h-4 text-danger shrink-0" />
                  <span className="text-sm font-semibold text-danger">
                    {REASONS.find(r => r.value === reason)?.label}
                  </span>
                </div>

                {/* Optional description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                    Additional details <span className="normal-case font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Provide any extra context that might help our team review this report..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    maxLength={500}
                    className="w-full px-3 py-2.5 rounded-xl border border-border-light text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
                  />
                  <p className="text-xs text-text-muted text-right">{description.length}/500</p>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full bg-danger hover:bg-red-700 text-white font-semibold rounded-xl h-11 transition-all"
                >
                  {submitting ? 'Submitting…' : 'Submit Report'}
                </Button>

                <p className="text-xs text-text-muted text-center leading-relaxed">
                  Reports are reviewed by our moderation team within 24–48 hours. False reports may affect your account.
                </p>
              </div>
            )}

            {/* Step: success */}
            {step === 'done' && (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-navy text-lg">Report Submitted</h3>
                  <p className="text-sm text-text-muted mt-1 leading-relaxed">
                    Thank you for helping keep CampusNest safe. Our team will review your report shortly.
                  </p>
                </div>
                <Button
                  onClick={() => setOpen(false)}
                  variant="outline"
                  className="w-full rounded-xl"
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
