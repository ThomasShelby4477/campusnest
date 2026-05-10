'use client'

import { useEffect, useState } from 'react'
import { useFeedStore } from '@/stores/feed-store'
import { RoommateCard } from './roommate-card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'
import { EmptyState } from '@/components/empty-state'
import { ErrorBoundary } from '@/components/error-boundary'

interface Props {
  mode: 'roommate' | 'buddy'
}

function RoommateFeedInner({ mode }: Props) {
  const { feed, loading, setFeed, setLoading, popCard } = useFeedStore()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [matchAnimation, setMatchAnimation] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchFeed()
    
    // Subscribe to new matches
    const subscribeMatches = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const channel = supabase.channel('my-matches')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user_a_id=eq.${user.id}`
        }, (payload) => {
          showMatchOverlay(payload.new)
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user_b_id=eq.${user.id}`
        }, (payload) => {
          showMatchOverlay(payload.new)
        })
        .subscribe()
        
      return () => { supabase.removeChannel(channel) }
    }
    
    const cleanup = subscribeMatches()
    return () => { cleanup.then(c => c && c()) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fetchFeed = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/roommates/feed')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let filtered = data.results
      if (mode === 'buddy') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        filtered = filtered.filter((r: any) => r.looking_for_buddy)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        filtered = filtered.filter((r: any) => !r.looking_for_buddy)
      }
      
      setFeed(filtered)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : ''
      if (message.includes('complete quiz')) {
        toast.error('Please complete the lifestyle quiz first')
      } else {
        toast.error('Failed to load feed')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (targetId: string) => {
    popCard()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      await supabase.from('roommate_likes').insert({
        liker_id: user.id,
        liked_id: targetId
      })
    } catch (err) {
      console.error('Like failed:', err)
    }
  }

  const handleSkip = (targetId: string) => {
    popCard()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const showMatchOverlay = async (matchPayload: any) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const otherId = matchPayload.user_a_id === user.id ? matchPayload.user_b_id : matchPayload.user_a_id
    
    const { data: otherProfile } = await supabase.from('profiles').select('name, avatar_url').eq('id', otherId).single()
    const { data: myProfile } = await supabase.from('profiles').select('name, avatar_url').eq('id', user.id).single()
    
    setMatchAnimation({
      id: matchPayload.id,
      me: myProfile,
      other: otherProfile
    })
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-coral/30 border-t-coral rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative w-full h-full pb-8">
      
      {feed.length === 0 && !matchAnimation ? (
        <div className="px-4 w-full flex justify-center">
          <EmptyState
            icon={mode === 'buddy' ? 'roommates' : 'roommates'}
            title={mode === 'buddy' ? 'No buddies found' : 'No more profiles'}
            description={mode === 'buddy' ? 'No one is looking for a house-hunting buddy right now. Toggle your own buddy mode in Profile!' : 'Check back later for new potential roommates.'}
            actionLabel="Refresh Feed"
            onAction={fetchFeed}
          />
        </div>
      ) : (
        <div className="relative w-full max-w-[340px] aspect-[3/4] sm:aspect-[4/5] mx-auto">
          {/* Render bottom up so first is on top */}
          {[...feed].reverse().map((target, index) => (
            <RoommateCard 
              key={target.id}
              target={target}
              isTop={index === feed.length - 1}
              onLike={() => handleLike(target.id)}
              onSkip={() => handleSkip(target.id)}
            />
          ))}
        </div>
      )}

      {/* Desktop action buttons */}
      {feed.length > 0 && (
        <div className="hidden sm:flex items-center gap-6 mt-8">
          <button 
            onClick={() => handleSkip(feed[0].id)}
            className="w-16 h-16 rounded-full bg-white border border-border-light shadow-sm flex items-center justify-center text-danger hover:bg-danger/5 transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
          <button 
            onClick={() => handleLike(feed[0].id)}
            className="w-16 h-16 rounded-full bg-white border border-border-light shadow-sm flex items-center justify-center text-success hover:bg-success/5 transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
          </button>
        </div>
      )}

      {/* Match Overlay */}
      {matchAnimation && (
        <div className="fixed inset-0 z-50 bg-navy/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white italic tracking-widest mb-8 sm:mb-12 transform -rotate-6">IT&apos;S A MATCH!</h1>
          
          <div className="flex items-center justify-center gap-4 md:gap-8 mb-8 sm:mb-12">
            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full border-4 border-coral overflow-hidden bg-white shrink-0">
              {matchAnimation.me.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={matchAnimation.me.avatar_url} alt="Me" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-navy/10 flex items-center justify-center font-bold text-2xl sm:text-3xl text-navy">
                  {matchAnimation.me.name?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-coral flex items-center justify-center text-white z-10 shrink-0 shadow-xl">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            </div>

            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full border-4 border-coral overflow-hidden bg-white shrink-0">
              {matchAnimation.other.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={matchAnimation.other.avatar_url} alt="Other" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-navy/10 flex items-center justify-center font-bold text-2xl sm:text-3xl text-navy">
                  {matchAnimation.other.name?.charAt(0) || 'U'}
                </div>
              )}
            </div>
          </div>

          <p className="text-white/80 mb-6 sm:mb-8 text-center max-w-sm text-sm sm:text-base">
            You and {matchAnimation.other.name} liked each other.
          </p>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Link href={`/chat/${matchAnimation.id}`}>
              <Button className="w-full h-12 bg-coral hover:bg-coral-dark text-white rounded-full font-bold">
                Send a Message
              </Button>
            </Link>
            <Button variant="ghost" className="w-full h-12 text-white/70 hover:text-white hover:bg-white/10 rounded-full" onClick={() => setMatchAnimation(null)}>
              Keep Swiping
            </Button>
          </div>
        </div>
      )}

    </div>
  )
}

export function RoommateFeed({ mode }: Props) {
  return (
    <ErrorBoundary fallbackTitle="Failed to load roommate feed">
      <RoommateFeedInner mode={mode} />
    </ErrorBoundary>
  )
}
