'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, Building2 } from 'lucide-react'

interface RoleStepProps {
  onSelect: (role: 'STUDENT' | 'LANDLORD') => void
}

export function RoleStep({ onSelect }: RoleStepProps) {
  return (
    <Card className="border-border-light shadow-lg">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold text-text-primary">Who are you?</CardTitle>
        <CardDescription className="text-text-muted">
          This helps us personalize your experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <button
          type="button"
          onClick={() => onSelect('STUDENT')}
          className="w-full p-5 rounded-xl border-2 border-border-light hover:border-navy hover:bg-navy/5
                     transition-all duration-200 text-left flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-full bg-navy/10 flex items-center justify-center
                          group-hover:bg-navy/20 transition-colors">
            <GraduationCap className="w-6 h-6 text-navy" />
          </div>
          <div>
            <p className="font-semibold text-text-primary text-lg">I&apos;m a Student</p>
            <p className="text-sm text-text-muted">Looking for housing or a roommate</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelect('LANDLORD')}
          className="w-full p-5 rounded-xl border-2 border-border-light hover:border-coral hover:bg-coral/5
                     transition-all duration-200 text-left flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-full bg-coral/10 flex items-center justify-center
                          group-hover:bg-coral/20 transition-colors">
            <Building2 className="w-6 h-6 text-coral" />
          </div>
          <div>
            <p className="font-semibold text-text-primary text-lg">I&apos;m a Property Owner</p>
            <p className="text-sm text-text-muted">I want to list my property</p>
          </div>
        </button>
      </CardContent>
    </Card>
  )
}
