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
  const [chatsWithUnread, setChatsWithUnread] = useState(0)
  const pathname = usePathname()
  const supabase = createClient()
  const isActive = pathname === '/chats' || pathname.startsWith('/chats/')

  useEffect(() => {
    let isMounted = true
    let activeChannels: any[] = []

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

      // Count how many distinct chats have at least 1 unread message from someone else
      const { data: unreadMessages } = await supabase
        .from('messages')
        .select('match_id')
        .in('match_id', matchIds)
        .eq('is_read', false)
        .neq('sender_id', user.id)

      if (unreadMessages && isMounted) {
        const distinctChats = new Set(unreadMessages.map(m => m.match_id)).size
        setChatsWithUnread(distinctChats)
      }

      // Realtime: re-fetch full count on any message change (insert or update)
      const refetch = async () => {
        const { data: msgs } = await supabase
          .from('messages')
          .select('match_id')
          .in('match_id', matchIds)
          .eq('is_read', false)
          .neq('sender_id', user.id)
        if (msgs && isMounted) {
          setChatsWithUnread(new Set(msgs.map(m => m.match_id)).size)
        }
      }

      const channel = supabase.channel('global-chat-unread')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, refetch)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, refetch)
        
      if (isMounted) {
        channel.subscribe()
        activeChannels.push(channel)
      } else {
        supabase.removeChannel(channel)
      }
    }

    init()
    return () => {
      isMounted = false
      activeChannels.forEach(c => supabase.removeChannel(c))
    }
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
        {chatsWithUnread > 0 && (
          <span className="w-5 h-5 rounded-full bg-coral text-white text-[10px] font-bold flex items-center justify-center">
            {chatsWithUnread > 9 ? '9+' : chatsWithUnread}
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
        {chatsWithUnread > 0 && (
          <span className="absolute -top-1.5 -right-2.5 w-4 h-4 rounded-full bg-coral text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">
            {chatsWithUnread > 9 ? '9+' : chatsWithUnread}
          </span>
        )}
      </div>
      <span className="text-[10px] font-bold">Chats</span>
    </Link>
  )
}
