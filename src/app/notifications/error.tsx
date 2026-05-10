'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Route error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-muted-bg flex items-center justify-center p-4">
      <div className="bg-white border border-border-light rounded-2xl p-8 sm:p-12 text-center shadow-sm max-w-md mx-auto">
        <svg width="100" height="100" viewBox="0 0 120 120" fill="none" className="mx-auto mb-6">
          <circle cx="60" cy="60" r="50" fill="#FEF2F2" stroke="#FCA5A5" strokeWidth="2" />
          <path d="M60 40V70" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" />
          <circle cx="60" cy="82" r="3" fill="#EF4444" />
        </svg>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Something went wrong</h2>
        <p className="text-text-muted mb-8 leading-relaxed">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <Button
          onClick={reset}
          className="h-12 px-8 bg-navy hover:bg-navy-dark text-white text-base"
        >
          Try Again
        </Button>
      </div>
    </div>
  )
}
