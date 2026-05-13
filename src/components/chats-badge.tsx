'use client'

import { useState, useEffect } from 'react'
import { MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  variant: 'desktop' | 'mobile'
}

export function ChatsBadge({ variant }: Props) {
  const [unreadCount, setUnreadCount] = useState(0)
  const pathname = usePathname()
  const supabase = createClient()
  const isActive = pathname === '/chats' || pathname.startsWith('/chats/')

  useEffect(() => {
    let cleanup: (() => void) | undefined

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get all match IDs for this user that are not closed
      const { data: matches } = await supabase
        .from('matches')
        .select('id')
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .neq('is_closed', true)

      if (!matches || matches.length === 0) return

      const matchIds = matches.map(m => m.id)

      // Count total unread messages across all chats
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('match_id', matchIds)
        .eq('is_read', false)
        .neq('sender_id', user.id)

      if (count !== null) setUnreadCount(count)

      // Subscribe to new messages in all matches
      const channel = supabase.channel('global-chat-unread')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => {
            // Only count if it's in one of our matches and not from us
            if (matchIds.includes(payload.new.match_id) && payload.new.sender_id !== user.id) {
              setUnreadCount(prev => prev + 1)
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'messages' },
          (payload) => {
            // When a message is marked as read, decrement
            if (
              matchIds.includes(payload.new.match_id) &&
              payload.new.is_read && !payload.old?.is_read &&
              payload.new.sender_id !== user.id
            ) {
              setUnreadCount(prev => Math.max(0, prev - 1))
            }
          }
        )
        .subscribe()

      cleanup = () => { supabase.removeChannel(channel) }
    }

    init()
    return () => { cleanup?.() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (variant === 'desktop') {
    return (
      <Link
        href="/chats"
        className={`text-sm font-bold hidden sm:flex items-center gap-1 transition-colors relative ${
          isActive ? 'text-navy' : 'text-text-muted hover:text-navy'
        }`}
      >
        Chats
        {unreadCount > 0 && (
          <span className="w-5 h-5 rounded-full bg-coral text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Link>
    )
  }

  // Mobile
  return (
    <Link
      href="/chats"
      className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors relative ${
        isActive ? 'text-coral' : 'text-text-muted'
      }`}
    >
      <div className="relative">
        <MessageSquare className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-2.5 w-4 h-4 rounded-full bg-coral text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>
      <span className="text-[10px] font-bold">Chats</span>
    </Link>
  )
}
