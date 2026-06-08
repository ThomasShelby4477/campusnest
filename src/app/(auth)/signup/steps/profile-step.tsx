'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import { UserCircle } from 'lucide-react'

// Use standard 'zod' (not 'zod/v4') so zodResolver works correctly
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  year: z.number().int().min(1).max(5).optional(),
  branch: z.string().min(1, 'Branch is required').optional(),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Enter a valid phone number (e.g. +91 9876543210)'),
  gender: z.enum(['MALE', 'FEMALE'], { message: 'Please select your gender' }),
})

type ProfileForm = z.infer<typeof profileSchema>

const BRANCHES = [
  'Computer Science', 'Forensic Science', 'Cyber Security',
  'Digital Forensics', 'Information Technology', 'Biotechnology',
  'Biochemistry', 'Law', 'Commerce', 'Arts', 'Other',
]

interface ProfileStepProps {
  onComplete: (role?: string) => void
}

export function ProfileStep({ onComplete }: ProfileStepProps) {
  const [loading, setLoading] = useState(false)
  const { user, updateUser } = useAuthStore()
  const isLandlord = user?.role === 'LANDLORD'

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<ProfileForm>({
    mode: 'onChange',
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? '',
      phone: user?.phone ?? '',
    },
  })

  // Watch selected values for controlled selects
  const selectedGender = watch('gender') as 'MALE' | 'FEMALE' | undefined
  const selectedYear = watch('year') as number | undefined
  const selectedBranch = watch('branch') as string | undefined

  const onSubmit = async (data: ProfileForm) => {
    setLoading(true)
    try {
      const payload: Record<string, unknown> = {
        name: data.name,
        phone: data.phone,
        gender: data.gender,
      }
      if (!isLandlord) {
        payload.year = data.year
        payload.branch = data.branch
      }

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || 'Failed to save profile')
        return
      }
      updateUser(result.profile)
      toast.success('Profile saved!')
      onComplete(user?.role)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-border-light shadow-lg">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-navy/10 flex items-center justify-center mb-3">
          <UserCircle className="w-7 h-7 text-navy" />
        </div>
        <CardTitle className="text-2xl font-bold text-text-primary">Complete Your Profile</CardTitle>
        <CardDescription className="text-text-muted">Tell us a bit about yourself</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Full Name</Label>
            <Input
              id="profile-name"
              placeholder="Your full name"
              {...register('name')}
              className="h-11"
              disabled={loading}
            />
            {errors.name && <p className="text-sm text-danger">{errors.name.message}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="profile-phone">Phone Number</Label>
            <Input
              id="profile-phone"
              placeholder="+91 9876543210"
              type="tel"
              {...register('phone')}
              className="h-11"
              disabled={loading}
            />
            {errors.phone && <p className="text-sm text-danger">{errors.phone.message}</p>}
          </div>

          {/* Gender */}
          <div className="space-y-1.5">
            <Label>Gender</Label>
            <Select
              value={selectedGender ?? ''}
              onValueChange={(v) => setValue('gender', v as 'MALE' | 'FEMALE', { shouldValidate: true })}
              disabled={loading}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && <p className="text-sm text-danger">{errors.gender.message}</p>}
          </div>

          {/* Student-only fields */}
          {!isLandlord && (
            <>
              <div className="space-y-1.5">
                <Label>Year of Study</Label>
                <Select
                  value={selectedYear != null ? String(selectedYear) : ''}
                  onValueChange={(v) => { if (v) setValue('year', parseInt(v), { shouldValidate: true }) }}
                  disabled={loading}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((y) => (
                      <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Branch</Label>
                <Select
                  value={selectedBranch ?? undefined}
                  onValueChange={(v) => { if (v) setValue('branch', v, { shouldValidate: true }) }}
                  disabled={loading}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANCHES.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.branch && <p className="text-sm text-danger">{errors.branch.message}</p>}
              </div>
            </>
          )}

          <Button
            type="submit"
            disabled={loading || !isValid}
            className="w-full h-12 bg-coral hover:bg-coral-dark text-white font-semibold text-base mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              'Continue'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
