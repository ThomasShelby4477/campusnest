'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { MessageSquare, UserCircle2, Check, CheckCheck } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'

export default function ChatsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [chats, setChats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const fetchChats = useCallback(async (userId: string) => {
    // Fetch all matches this user is part of
    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        id, chat_type, created_at, is_closed,
        user_a:profiles!matches_user_a_id_fkey ( id, name, avatar_url ),
        user_b:profiles!matches_user_b_id_fkey ( id, name, avatar_url )
      `)
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('chats fetch error:', error)
      return []
    }

    // For each match, fetch the last message + unread count
    const chatsWithMessages = await Promise.all(
      (matches || []).map(async (match) => {
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('content, created_at, sender_id, is_read')
          .eq('match_id', match.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        // Count unread messages (messages from the OTHER person that I haven't read)
        const { count: unread } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('match_id', match.id)
          .eq('is_read', false)
          .neq('sender_id', userId)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const otherUser = (match as any).user_a?.id === userId ? match.user_b : match.user_a

        return {
          ...match,
          otherUser,
          lastMessage: lastMsg,
          unreadCount: unread || 0,
        }
      })
    )

    // Sort by last message time (most recent first)
    chatsWithMessages.sort((a, b) => {
      const aTime = a.lastMessage?.created_at || a.created_at
      const bTime = b.lastMessage?.created_at || b.created_at
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })

    return chatsWithMessages
  }, [supabase])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirect=/chats')
        return
      }
      setCurrentUserId(user.id)

      const data = await fetchChats(user.id)
      setChats(data)
      setLoading(false)

      // Subscribe to message changes to update unread counts in realtime
      const channel = supabase.channel('chats-list-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'messages' },
          async () => {
            // Re-fetch chats to get updated unread counts & last messages
            const updated = await fetchChats(user.id)
            setChats(updated)
          }
        )
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }

    let cleanup: (() => void) | undefined
    init().then(c => { cleanup = c })
    return () => { cleanup?.() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted-bg">
        <span className="w-8 h-8 border-4 border-coral/30 border-t-coral rounded-full animate-spin" />
      </div>
    )
  }

  const totalUnread = chats.reduce((sum, c) => sum + c.unreadCount, 0)

  return (
    <div className="min-h-screen bg-muted-bg pb-20 sm:pb-8">
      <div className="max-w-2xl mx-auto pt-6 sm:pt-8 px-4">
        <div className="flex items-center gap-3 mb-6 sticky top-16 z-30 bg-muted-bg/95 backdrop-blur-sm py-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="w-12 h-12 rounded-xl bg-navy/10 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-navy" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Chats</h1>
            <p className="text-text-muted mt-0.5 text-sm">
              {chats.length} conversation{chats.length !== 1 ? 's' : ''}
              {totalUnread > 0 && <span className="text-coral font-semibold"> · {totalUnread} unread</span>}
            </p>
          </div>
        </div>

        {chats.length === 0 ? (
          <EmptyState
            icon="notifications"
            title="No chats yet"
            description="When someone accepts your interest on a listing or you match with a roommate, your chats will appear here."
          />
        ) : (
          <div className="bg-white rounded-2xl border border-border-light overflow-hidden shadow-sm">
            {chats.map((chat, i) => {
              const other = chat.otherUser
              const last = chat.lastMessage
              const hasUnread = !chat.is_closed && chat.unreadCount > 0
              const isMineLastMsg = last?.sender_id === currentUserId
              const closed = chat.is_closed

              const typeLabel =
                closed ? 'Closed' :
                chat.chat_type === 'LISTING' ? 'Listing' :
                chat.chat_type === 'BUDDY' ? 'Buddy' : 'Roommate'

              return (
                <Link
                  key={chat.id}
                  href={`/chat/${chat.id}`}
                  className={`flex items-center gap-3 p-4 hover:bg-muted-bg/50 transition-colors ${
                    i < chats.length - 1 ? 'border-b border-border-light' : ''
                  } ${hasUnread ? 'bg-coral/[0.03]' : ''} ${closed ? 'opacity-60' : ''}`}
                >
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-muted-bg shrink-0 border border-border-light">
                    {other?.avatar_url ? (
                      <Image src={other.avatar_url} alt={other.name || ''} fill className="object-cover" />
                    ) : (
                      <UserCircle2 className="w-full h-full text-text-muted p-1" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`font-bold truncate ${hasUnread ? 'text-navy' : 'text-text-primary'}`}>
                        {other?.name || 'User'}
                      </h3>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          closed ? 'text-danger bg-danger/10' : 'text-text-muted bg-muted-bg'
                        }`}>
                          {typeLabel}
                        </span>
                        <span className={`text-[11px] shrink-0 ${hasUnread ? 'text-coral font-semibold' : 'text-text-muted'}`}>
                          {last?.created_at
                            ? formatRelativeTime(last.created_at)
                            : formatRelativeTime(chat.created_at)
                          }
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <div className="flex items-center gap-1 min-w-0 flex-1">
                        {/* Read receipt for your own messages */}
                        {isMineLastMsg && last && (
                          last.is_read
                            ? <CheckCheck className="w-3.5 h-3.5 text-coral shrink-0" />
                            : <Check className="w-3.5 h-3.5 text-text-muted/50 shrink-0" />
                        )}
                        <p className={`text-sm truncate ${hasUnread ? 'text-text-primary font-medium' : 'text-text-muted'}`}>
                          {last?.content
                            ? (isMineLastMsg ? `You: ${last.content}` : last.content)
                            : 'No messages yet'
                          }
                        </p>
                      </div>
                      {hasUnread && (
                        <span className="w-5 h-5 rounded-full bg-coral text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'now'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
