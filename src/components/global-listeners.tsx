'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { playNotificationSound } from '@/lib/sound'

export function GlobalListeners() {
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user) return

    const supabase = createClient()

    const channel = supabase.channel('global-sounds')
      // Listen for new messages
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        if (payload.new && payload.new.sender_id !== user.id) {
          const isDifferentChat = window.location.pathname !== `/chat/${payload.new.match_id}`
          const isNotFocused = !document.hasFocus()
          if (isDifferentChat || isNotFocused) {
            playNotificationSound()
          }
        }
      })
      // Listen for new notifications
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
        if (!payload.new.is_read) {
          playNotificationSound()
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  return null
}
