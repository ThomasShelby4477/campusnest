'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore, useSignupStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import { EmailStep } from './steps/email-step'
import { OtpStep } from './steps/otp-step'
import { RoleStep } from './steps/role-step'
import { ProfileStep } from './steps/profile-step'
import { IdUploadStep } from './steps/id-upload-step'
import { PendingStep } from './steps/pending-step'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const { step, setStep, email, setEmail } = useSignupStore()
  const { setUser } = useAuthStore()
  const [isTransitioning, setIsTransitioning] = useState(false)

  const goToStep = useCallback(
    (nextStep: typeof step) => {
      setIsTransitioning(true)
      setTimeout(() => {
        setStep(nextStep)
        setIsTransitioning(false)
      }, 200)
    },
    [setStep]
  )

  const handleEmailSubmit = async (emailValue: string) => {
    setEmail(emailValue)
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailValue, context: 'signup' }),
    })
    const data = await res.json()

    if (res.status === 409 && data.error === 'user_exists') {
      // User already registered — prompt them to log in
      goToStep('already-exists')
      return
    }

    if (!res.ok) {
      toast.error(data.error || 'Failed to send OTP')
      return
    }
    toast.success('OTP sent! Check your inbox.')
    goToStep('otp')
  }

  const handleOtpVerify = async (token: string) => {
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })
    if (error) {
      toast.error(error.message || 'Invalid OTP')
      return
    }
    toast.success('Email verified!')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profile) {
      setUser(profile)
      if (!profile.name) {
        goToStep('role')
      } else if (!profile.student_id_path && profile.role === 'STUDENT' && profile.verified_status === 'PARTIAL') {
        goToStep('id-upload')
      } else if (profile.verified_status === 'PENDING') {
        goToStep('pending')
      } else if (profile.verified_status === 'REJECTED') {
        goToStep('id-upload')
      } else {
        router.push('/search')
      }
    } else {
      goToStep('role')
    }
  }

  const handleRoleSelect = async (role: 'STUDENT' | 'LANDLORD') => {
    if (role === 'LANDLORD') {
      goToStep('profile')
    } else {
      goToStep('profile')
    }
  }

  const handleProfileComplete = async (role?: string) => {
    if (role === 'LANDLORD') {
      router.push('/search')
    } else {
      goToStep('id-upload')
    }
  }

  const handleIdUploaded = () => {
    goToStep('pending')
  }

  const stepComponents: Record<string, React.ReactNode> = {
    email: <EmailStep onSubmit={handleEmailSubmit} />,
    otp: <OtpStep email={email} onVerify={handleOtpVerify} onBack={() => goToStep('email')} />,
    role: <RoleStep onSelect={handleRoleSelect} />,
    profile: <ProfileStep onComplete={handleProfileComplete} />,
    'id-upload': <IdUploadStep onUploaded={handleIdUploaded} />,
    pending: <PendingStep />,
    'already-exists': (
      <div className="bg-white rounded-2xl border border-border-light shadow-sm p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-coral/10 rounded-full flex items-center justify-center mx-auto">
          <span className="text-3xl">👋</span>
        </div>
        <h2 className="text-xl font-bold text-text-primary">Welcome back!</h2>
        <p className="text-text-muted text-sm leading-relaxed">
          An account with <span className="font-semibold text-navy">{email}</span> already exists.
          Please log in instead.
        </p>
        <Link
          href={`/login`}
          className="block w-full py-3 bg-coral text-white rounded-xl font-semibold text-sm hover:bg-coral-dark transition-colors"
        >
          Go to Login →
        </Link>
        <button
          onClick={() => goToStep('email')}
          className="text-sm text-text-muted hover:text-navy transition-colors"
        >
          Use a different email
        </button>
      </div>
    ),
  }

  const stepIndex = ['email', 'otp', 'role', 'profile', 'id-upload', 'pending'].indexOf(step)
  const totalSteps = 6

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted-bg px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-navy">
              🏠 CampusNest
            </h1>
            <p className="text-text-muted text-sm mt-1">Student Housing & Roommate Finder</p>
          </Link>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-muted font-medium">
              Step {stepIndex + 1} of {totalSteps}
            </span>
          </div>
          <div className="h-1.5 bg-border-light rounded-full overflow-hidden">
            <div
              className="h-full bg-coral rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div
          className={`transition-all duration-200 ease-out ${
            isTransitioning ? 'opacity-0 translate-x-5' : 'opacity-100 translate-x-0'
          }`}
        >
          {stepComponents[step]}
        </div>

        {/* Login link */}
        {(step === 'email') && (
          <p className="text-center text-sm text-text-muted mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-coral font-semibold hover:underline">
              Log in
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
