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
import React from 'react'

export default function SignupPage() {
  const router = useRouter()
  const { step, setStep, email, setEmail } = useSignupStore()
  const { setUser, updateUser } = useAuthStore()
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

  // ── Step 1: Email ─────────────────────────────────────────
  const handleEmailSubmit = async (emailValue: string) => {
    setEmail(emailValue)
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailValue, context: 'signup' }),
    })
    const data = await res.json()

    if (res.status === 409 && data.error === 'user_exists') {
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

  // ── Step 2: OTP ───────────────────────────────────────────
  // IMPORTANT: Use the server-side verify-otp API route (not the client SDK)
  // so that session cookies are properly set server-side via @supabase/ssr.
  // Calling supabase.auth.verifyOtp() directly from the client does NOT set
  // the HttpOnly cookies, breaking all subsequent server-side auth checks.
  const handleOtpVerify = async (token: string) => {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token, redirect: '/signup' }),
    })

    const data = await res.json()

    if (res.status === 403 && data.suspended) {
      toast.error('Your account has been suspended. Contact email@campusnest.com', { duration: 5000 })
      setTimeout(() => { window.location.href = '/suspended' }, 800)
      return
    }

    if (!res.ok) {
      toast.error(data.error || 'Invalid OTP. Please try again.')
      throw new Error(data.error)
    }

    // Sync session to browser Supabase client → triggers onAuthStateChange → navbar updates
    if (data.access_token && data.refresh_token) {
      const supabase = createClient()
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      })
    }

    // Fetch the profile to decide which step to resume at
    const profileRes = await fetch('/api/auth/me')
    if (!profileRes.ok) {
      // Profile doesn't exist yet — go to role selection
      goToStep('role')
      return
    }

    const { profile } = await profileRes.json()
    if (profile) {
      setUser(profile)

      if (!profile.name) {
        // Hasn't filled in profile yet — start from role
        goToStep('role')
      } else if (profile.role === 'STUDENT' && !profile.student_id_path) {
        // Profile done but no ID uploaded
        goToStep('id-upload')
      } else if (profile.verified_status === 'PENDING') {
        goToStep('pending')
      } else if (profile.verified_status === 'REJECTED') {
        router.push('/reverify')
      } else if (profile.verified_status === 'VERIFIED') {
        router.push('/search')
      } else {
        goToStep('role')
      }
    } else {
      goToStep('role')
    }
  }

  // ── Step 3: Role ──────────────────────────────────────────
  // Save the role to the database immediately when selected,
  // then update the local store so ProfileStep knows it.
  const handleRoleSelect = async (role: 'STUDENT' | 'LANDLORD') => {
    // Optimistically update store so ProfileStep renders correct fields
    updateUser({ role })

    // Persist role to database via dedicated API endpoint
    const res = await fetch('/api/auth/set-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })

    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error || 'Failed to set role. Please try again.')
      // Revert optimistic update
      updateUser({ role: 'STUDENT' })
      return
    }

    const data = await res.json()
    if (data.profile) setUser(data.profile)

    goToStep('profile')
  }

  // ── Step 4: Profile ───────────────────────────────────────
  const handleProfileComplete = async (role?: string) => {
    if (role === 'LANDLORD') {
      // Landlords are auto-verified — go straight to search
      toast.success('Welcome to CampusNest!')
      router.push('/search')
    } else {
      // Students need to upload ID
      goToStep('id-upload')
    }
  }

  // ── Step 5: ID Upload ─────────────────────────────────────
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

  const signupSteps = ['email', 'otp', 'role', 'profile', 'id-upload', 'pending']
  const stepIndex = signupSteps.indexOf(step)
  const totalSteps = signupSteps.length

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted-bg px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-navy">🏠 CampusNest</h1>
            <p className="text-text-muted text-sm mt-1">Student Housing &amp; Roommate Finder</p>
          </Link>
        </div>

        {/* Progress bar (only show during main steps) */}
        {stepIndex >= 0 && (
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
        )}

        {/* Step content */}
        <div
          className={`transition-all duration-200 ease-out ${
            isTransitioning ? 'opacity-0 translate-x-5' : 'opacity-100 translate-x-0'
          }`}
        >
          {stepComponents[step]}
        </div>

        {/* Login link */}
        {step === 'email' && (
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
