'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'

import { zodResolver } from '@hookform/resolvers/zod'

const ALLOWED_DOMAIN = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || 'nfsu.ac.in'

const emailSchema = z.object({
  email: z.string().trim().email('Please enter a valid email').refine(
    (e) => e.endsWith(`@${ALLOWED_DOMAIN}`),
    { message: `Only @${ALLOWED_DOMAIN} emails are allowed` }
  ),
})

type EmailForm = z.infer<typeof emailSchema>

interface EmailStepProps {
  onSubmit: (email: string) => Promise<void>
}

export function EmailStep({ onSubmit }: EmailStepProps) {
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<EmailForm>({
    mode: 'onChange',
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  })

  const onFormSubmit = async (data: EmailForm) => {
    setLoading(true)
    try {
      await onSubmit(data.email)
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
        <CardTitle className="text-2xl font-bold text-text-primary">Get Started</CardTitle>
        <CardDescription className="text-text-muted">
          Enter your NFSU email to create an account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup-email" className="text-sm font-medium">
              College Email
            </Label>
            <Input
              id="signup-email"
              type="email"
              placeholder={`you@${ALLOWED_DOMAIN}`}
              autoComplete="email"
              autoFocus
              {...register('email')}
              className="h-12 text-base"
            />
            {errors.email && (
              <p className="text-sm text-danger">{errors.email.message}</p>
            )}
          </div>
          <Button
            type="submit"
            disabled={!isValid || loading}
            className="w-full h-12 bg-coral hover:bg-coral-dark text-white font-semibold text-base"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending OTP...
              </span>
            ) : (
              'Send OTP'
            )}
          </Button>
        </form>
        <p className="text-xs text-text-muted text-center mt-4">
          We&apos;ll send a one-time code to verify your email
        </p>
      </CardContent>
    </Card>
  )
}
