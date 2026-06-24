'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Crown, Check } from 'lucide-react'
import { PLANS } from '@/lib/subscription'

/**
 * Reusable upgrade prompt shown to verified users who are not Pro.
 * Used by: create-listing page, my-listings inline prompt, etc.
 */
export function SubscriptionGate({
  title = 'Upgrade to CampusNest Pro',
  compact = false,
}: {
  title?: string
  compact?: boolean
}) {
  const plan = PLANS['pro-semester']

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-coral/5 via-coral/10 to-coral/5 border border-coral/20 rounded-2xl">
        <div className="w-10 h-10 rounded-xl bg-coral/10 flex items-center justify-center shrink-0">
          <Crown className="w-5 h-5 text-coral" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-navy">Pro Required</p>
          <p className="text-xs text-text-muted">
            Upgrade for {plan.displayPrice}/{plan.displayDuration}
          </p>
        </div>
        <Link href="/profile#subscription">
          <Button size="sm" className="bg-coral hover:bg-coral-dark text-white font-semibold rounded-xl shrink-0">
            Upgrade
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-muted-bg px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-3xl border border-border-light shadow-lg shadow-navy/[0.03] p-8 sm:p-10">

          {/* Icon */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-coral/10 to-coral/20 flex items-center justify-center mx-auto mb-6">
            <Crown className="w-10 h-10 text-coral" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-black text-navy mb-2">{title}</h2>
          <p className="text-text-muted leading-relaxed mb-6">
            Get full access to all CampusNest features with a semester subscription.
          </p>

          {/* Benefits */}
          <div className="space-y-3 text-left mb-8">
            {[
              'Show interest on property listings',
              'Post your own property listings',
              'Contact listing posters directly',
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-success" />
                </div>
                <span className="text-sm font-medium text-text-primary">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Price */}
          <div className="mb-6">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-black text-navy">{plan.displayPrice}</span>
              <span className="text-text-muted font-medium">/ {plan.displayDuration}</span>
            </div>
            <p className="text-xs text-text-muted mt-1">One-time payment · No auto-renewal</p>
          </div>

          {/* CTA */}
          <Link href="/profile#subscription">
            <Button className="w-full h-12 bg-coral hover:bg-coral-dark text-white font-bold text-base rounded-2xl shadow-md shadow-coral/20 transition-all hover:shadow-lg hover:shadow-coral/25 active:scale-[0.98]">
              <Crown className="w-5 h-5 mr-2" /> Upgrade Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
