'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body className="min-h-screen bg-muted-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <svg width="140" height="140" viewBox="0 0 140 140" fill="none" className="mx-auto mb-8">
            <circle cx="70" cy="70" r="65" fill="#FEE2E2" stroke="#FECACA" strokeWidth="2" />
            <path d="M50 55C50 55 55 50 60 55" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M80 55C80 55 85 50 90 55" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M55 90C55 90 62 82 70 82C78 82 85 90 85 90" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="105" cy="25" r="8" fill="#E8593C" opacity="0.2" />
            <text x="102" y="29" fontSize="12" fontWeight="bold" fill="#E8593C">!</text>
          </svg>

          <h1 className="text-3xl font-black text-text-primary mb-3">Oops! Something broke.</h1>
          <p className="text-text-muted mb-8 leading-relaxed">
            An unexpected error occurred. Our team has been notified and is working on a fix.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => reset()} className="bg-coral hover:bg-coral-dark text-white gap-2 h-12 px-6 rounded-full font-bold">
              <RefreshCw className="w-4 h-4" /> Try Again
            </Button>
            <Link href="/">
              <Button variant="outline" className="gap-2 h-12 px-6 rounded-full font-bold w-full sm:w-auto">
                <Home className="w-4 h-4" /> Back Home
              </Button>
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
