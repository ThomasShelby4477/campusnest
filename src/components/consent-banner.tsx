'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function ConsentBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('consent_v1')
    if (!consent) {
      setTimeout(() => setShow(true), 0)
    }
  }, [])

  const handleAccept = async () => {
    setShow(false)
    localStorage.setItem('consent_v1', 'accepted')
    
    try {
      await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy_version: 'v1' })
      })
    } catch (err) {
      console.error('Failed to save consent', err)
    }
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 pb-safe animate-in slide-in-from-bottom duration-300">
      <div className="bg-navy max-w-4xl mx-auto rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg mb-2">We respect your privacy</h3>
          <p className="text-white/80 text-sm leading-relaxed">
            CampusNest uses strictly necessary cookies to keep you logged in and functional storage for your preferences. 
            We do not sell your data or use third-party ad trackers. By continuing, you agree to our{' '}
            <Link href="/terms" className="text-coral hover:underline font-medium">Terms</Link> and{' '}
            <Link href="/privacy" className="text-coral hover:underline font-medium">Privacy Policy</Link>.
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto shrink-0">
          <Button onClick={handleAccept} className="w-full sm:w-auto bg-coral hover:bg-coral-dark text-white rounded-full font-bold px-8 py-6 h-auto">
            I Accept
          </Button>
        </div>
      </div>
    </div>
  )
}
