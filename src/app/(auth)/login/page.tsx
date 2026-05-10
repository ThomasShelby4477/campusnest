'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { EmailStep } from '../signup/steps/email-step'
import { OtpStep } from '../signup/steps/otp-step'
import Link from 'next/link'

type LoginStep = 'email' | 'otp'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/search'
  const [step, setStep] = useState<LoginStep>('email')
  const [email, setEmail] = useState('')
  const [isTransitioning, setIsTransitioning] = useState(false)

  const goToStep = useCallback((nextStep: LoginStep) => {
    setIsTransitioning(true)
    setTimeout(() => {
      setStep(nextStep)
      setIsTransitioning(false)
    }, 200)
  }, [])

  const handleEmailSubmit = async (emailValue: string) => {
    setEmail(emailValue)
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailValue }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || 'Failed to send OTP')
      return
    }
    toast.success('OTP sent! Check your inbox.')
    goToStep('otp')
  }

  const handleOtpVerify = async (token: string) => {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token }),
    })

    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error || 'Invalid OTP. Please try again.')
      throw new Error(data.error)
    }

    // Sync the session to the browser Supabase client.
    // This triggers onAuthStateChange → AuthProvider fetches the profile → navbar updates.
    if (data.access_token && data.refresh_token) {
      const supabase = createClient()
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      })
    }

    toast.success('Welcome back!')
    router.push(data.redirectTo)
  }





  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted-bg px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-navy">🏠 CampusNest</h1>
            <p className="text-text-muted text-sm mt-1">Welcome back</p>
          </Link>
        </div>

        <div className={`transition-all duration-200 ease-out ${
          isTransitioning ? 'opacity-0 translate-x-5' : 'opacity-100 translate-x-0'
        }`}>
          {step === 'email' && <EmailStep onSubmit={handleEmailSubmit} />}
          {step === 'otp' && (
            <OtpStep email={email} onVerify={handleOtpVerify} onBack={() => goToStep('email')} />
          )}
        </div>

        <p className="text-center text-sm text-text-muted mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-coral font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
