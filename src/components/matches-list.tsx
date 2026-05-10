'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { UserCircle2 } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { ErrorBoundary } from '@/components/error-boundary'

function MatchesListInner() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchMatches()

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const channel = supabase.channel('matches-list')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches' }, () => {
          fetchMatches()
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
          fetchMatches()
        })
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }

    const cleanup = setupRealtime()
    return () => { cleanup.then(c => c && c()) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fetchMatches = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setCurrentUserId(user.id)

    const { data: matchesData } = await supabase
      .from('matches')
      .select(`
        *,
        user_a:profiles!matches_user_a_id_fkey(id, name, avatar_url),
        user_b:profiles!matches_user_b_id_fkey(id, name, avatar_url),
        messages(content, created_at, sender_id, is_read)
      `)
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)

    if (!matchesData) {
      setMatches([])
      setLoading(false)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const processed = matchesData.map(m => {
      const isUserA = m.user_a_id === user.id
      const otherUser = isUserA ? m.user_b : m.user_a
      
      const msgs = m.messages || []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lastMsg = msgs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const unreadCount = msgs.filter((msg: any) => !msg.is_read && msg.sender_id !== user.id).length

      return {
        ...m,
        otherUser,
        lastMsg,
        unreadCount,
        sortTime: lastMsg ? new Date(lastMsg.created_at).getTime() : new Date(m.created_at).getTime()
      }
    }).sort((a, b) => b.sortTime - a.sortTime)

    setMatches(processed)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <span className="w-8 h-8 border-4 border-coral/30 border-t-coral rounded-full animate-spin" />
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-8">
        <EmptyState
          icon="matches"
          title="No matches yet"
          description="Keep swiping to find potential roommates. When you both like each other, they'll appear here."
          actionLabel="Find Roommates"
          actionHref="/roommates"
        />
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto py-4">
      <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
        {matches.map((match, i) => (
          <Link 
            key={match.id} 
            href={`/chat/${match.id}`}
            className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-muted-bg transition-colors ${i !== matches.length - 1 ? 'border-b border-border-light' : ''}`}
          >
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-navy/5 shrink-0">
              {match.otherUser.avatar_url ? (
                <Image src={match.otherUser.avatar_url} alt={match.otherUser.name} fill className="object-cover" />
              ) : (
                <UserCircle2 className="w-full h-full text-text-muted p-1" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-bold text-text-primary truncate pr-2 text-sm sm:text-base">
                  {match.otherUser.name}
                  {match.chat_type === 'BUDDY' && <span className="ml-2 text-[10px] uppercase font-bold tracking-wider bg-navy text-white px-1.5 py-0.5 rounded-full">Buddy</span>}
                </h3>
                {match.lastMsg && (
                  <span className="text-[11px] text-text-muted shrink-0">
                    {new Date(match.lastMsg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <p className={`text-xs sm:text-sm truncate pr-4 ${match.unreadCount > 0 ? 'font-bold text-text-primary' : 'text-text-muted'}`}>
                  {match.lastMsg ? (
                    <>{match.lastMsg.sender_id === currentUserId ? 'You: ' : ''}{match.lastMsg.content}</>
                  ) : (
                    <span className="italic text-text-muted">Start a conversation</span>
                  )}
                </p>
                {match.unreadCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-coral text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {match.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function MatchesList() {
  return (
    <ErrorBoundary fallbackTitle="Failed to load matches">
      <MatchesListInner />
    </ErrorBoundary>
  )
}
