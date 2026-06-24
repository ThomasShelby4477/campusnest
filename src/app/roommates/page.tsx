'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Users } from 'lucide-react'

export default function RoommatesPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-muted-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-border-light p-8 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-coral/10">
          <Users className="h-10 w-10 text-coral" />
        </div>

        <h1 className="text-3xl font-black text-navy mb-3">Coming Soon</h1>

        <p className="text-muted-foreground mb-8 leading-relaxed">
          Roommate matching is currently under development. We&apos;re building
          smart compatibility matching to help you find the perfect roommate.
          Stay tuned!
        </p>

        <Link href="/search">
          <Button className="bg-navy hover:bg-navy-dark text-white rounded-2xl px-6">
            Browse Listings Instead
          </Button>
        </Link>
      </div>
    </div>
  )
}
