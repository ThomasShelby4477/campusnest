'use client'

import { useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useSignupStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import { OtpStep } from '../signup/steps/otp-step'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'

type LoginStep = 'email' | 'otp'

const ALLOWED_DOMAIN = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || 'nfsu.ac.in'

// ── Login-specific email card (different copy from signup's EmailStep) ──
function LoginEmailCard({
  onSubmit,
}: {
  onSubmit: (email: string) => Promise<void>
}) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const validate = (val: string) => {
    if (!val) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Enter a valid email address'
    if (!val.endsWith(`@${ALLOWED_DOMAIN}`)) return `Only @${ALLOWED_DOMAIN} emails are allowed`
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate(email.trim())
    if (err) { setError(err); return }
    setError('')
    setLoading(true)
    try {
      await onSubmit(email.trim())
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-border-light shadow-lg">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-navy/10 flex items-center justify-center mb-3">
          <Mail className="w-7 h-7 text-navy" />
        </div>
        <CardTitle className="text-2xl font-bold text-text-primary">Welcome Back</CardTitle>
        <CardDescription className="text-text-muted">
          Enter your NFSU email to sign in
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email" className="text-sm font-medium">
              College Email
            </Label>
            <Input
              id="login-email"
              type="email"
              placeholder={`you@${ALLOWED_DOMAIN}`}
              autoComplete="email"
              autoFocus
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              className="h-12 text-base"
              disabled={loading}
            />
            {error && <p className="text-sm text-danger">{error}</p>}
          </div>
          <Button
            type="submit"
            disabled={!email || loading}
            className="w-full h-12 bg-coral hover:bg-coral-dark text-white font-semibold text-base"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending OTP…
              </span>
            ) : (
              'Send OTP'
            )}
          </Button>
        </form>
        <p className="text-xs text-text-muted text-center mt-4">
          We'll send a one-time code to your email
        </p>
      </CardContent>
    </Card>
  )
}

// ── Inner component isolated so useSearchParams is inside a Suspense boundary ──
function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser } = useAuthStore()
  const { setStep: setSignupStep, setEmail: setSignupEmail } = useSignupStore()

  // [SECURITY M-6] Only allow relative paths — reject open redirect attacks
  const rawRedirect = searchParams.get('redirect') || '/search'
  const redirect =
    rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
      ? rawRedirect
      : '/search'

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
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailValue, context: 'login' }),
    })
    const data = await res.json()

    if (res.status === 409) {
      // User does not exist — guide them to signup
      toast.error("No account found for this email. Please sign up first.")
      return
    }
    if (!res.ok) {
      toast.error(data.error || 'Failed to send OTP. Please try again.')
      return
    }

    setEmail(emailValue)
    toast.success('OTP sent! Check your inbox.')
    goToStep('otp')
  }

  const handleOtpVerify = async (token: string) => {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token, redirect }),
    })

    const data = await res.json()

    // Suspended account
    if (res.status === 403 && data.suspended) {
      toast.error(
        'Your account has been suspended. For disputes, contact email@campusnest.com',
        { duration: 5000 }
      )
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

    // If the server says profile is incomplete → continue signup flow
    // instead of hard-redirecting to /signup (which would reset the store)
    if (data.redirectTo === '/signup') {
      // Load the profile and hand off to the signup wizard at the right step
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profile) {
          setUser(profile)
          setSignupEmail(email)

          if (!profile.name) {
            setSignupStep('role')
          } else if (!profile.student_id_path && profile.role === 'STUDENT') {
            setSignupStep('id-upload')
          } else {
            setSignupStep('pending')
          }
        } else {
          setSignupEmail(email)
          setSignupStep('role')
        }
      }
      toast('Please complete your profile to continue.', { icon: '📋' })
      router.push('/signup')
      return
    }

    toast.success('Welcome back!')
    router.push(data.redirectTo || redirect)
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

        <div
          className={`transition-all duration-200 ease-out ${
            isTransitioning ? 'opacity-0 translate-x-5' : 'opacity-100 translate-x-0'
          }`}
        >
          {step === 'email' && (
            <LoginEmailCard onSubmit={handleEmailSubmit} />
          )}
          {step === 'otp' && (
            <OtpStep
              email={email}
              onVerify={handleOtpVerify}
              onBack={() => goToStep('email')}
            />
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

// Wrap in Suspense — required by Next.js when useSearchParams is used in a client component
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-muted-bg">
          <div className="w-8 h-8 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
