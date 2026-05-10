'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod/v4'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import { UserCircle } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  year: z.number().int().min(1).max(5).optional(),
  branch: z.string().min(1, 'Branch is required').optional(),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
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
    formState: { errors },
  } = useForm<ProfileForm>({
    mode: 'onChange',
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
    },
  })

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
        toast.error(result.error || 'Failed to update profile')
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
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Full Name</Label>
            <Input id="profile-name" placeholder="Your full name" {...register('name', { required: true, minLength: 2 })} className="h-11" />
            {errors.name && <p className="text-sm text-danger">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="profile-phone">Phone Number</Label>
            <Input id="profile-phone" placeholder="+91 9876543210" {...register('phone', { required: true })} className="h-11" />
            {errors.phone && <p className="text-sm text-danger">{errors.phone.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Gender</Label>
            <Select onValueChange={(v) => setValue('gender', v as ProfileForm['gender'], { shouldValidate: true })}>
              <SelectTrigger className="h-11"><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && <p className="text-sm text-danger">{errors.gender.message}</p>}
          </div>

          {!isLandlord && (
            <>
              <div className="space-y-1.5">
                <Label>Year of Study</Label>
                <Select onValueChange={(v) => setValue('year', parseInt(v as string), { shouldValidate: true })}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((y) => (
                      <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Branch</Label>
                <Select onValueChange={(v) => setValue('branch', v as string, { shouldValidate: true })}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    {BRANCHES.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <Button
            type="submit"
            disabled={loading}
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
