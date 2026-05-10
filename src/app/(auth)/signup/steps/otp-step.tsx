'use client'

import { useState, useRef, useEffect, type KeyboardEvent, type ClipboardEvent } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldCheck, ArrowLeft } from 'lucide-react'

interface OtpStepProps {
  email: string
  onVerify: (token: string) => Promise<void>
  onBack: () => void
}

export function OtpStep({ email, onVerify, onBack }: OtpStepProps) {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [loading, setLoading] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      inputRefs.current[5]?.focus()
    }
  }

  const handleSubmit = async () => {
    const token = otp.join('')
    if (token.length !== 6) return
    setLoading(true)
    try {
      await onVerify(token)
      // If onVerify resolves without throwing, navigation is in progress.
      // Keep the spinner going so there's no flash before the page changes.
    } catch {
      // onVerify threw (OTP error) — clear the spinner so user can retry
      setLoading(false)
    }
  }

  const isComplete = otp.every((d) => d !== '')

  return (
    <Card className="border-border-light shadow-lg">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mb-3">
          <ShieldCheck className="w-7 h-7 text-success" />
        </div>
        <CardTitle className="text-2xl font-bold text-text-primary">Verify Your Email</CardTitle>
        <CardDescription className="text-text-muted">
          Enter the 6-digit code sent to<br />
          <span className="font-semibold text-text-primary">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center gap-2 mb-6">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              aria-label={`OTP digit ${i + 1}`}
              className="w-12 h-14 text-center text-xl font-bold border-2 border-border-light rounded-lg
                         focus:border-navy focus:ring-2 focus:ring-navy/20 outline-none
                         transition-all bg-white"
            />
          ))}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!isComplete || loading}
          className="w-full h-12 bg-coral hover:bg-coral-dark text-white font-semibold text-base"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Verifying...
            </span>
          ) : (
            'Verify Code'
          )}
        </Button>

        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center gap-1 w-full mt-3 text-sm text-text-muted hover:text-navy transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Use a different email
        </button>
      </CardContent>
    </Card>
  )
}
