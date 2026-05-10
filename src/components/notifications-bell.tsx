'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { requestFirebaseToken, onMessageListener } from '@/lib/firebase'
import { toast } from 'sonner'

export function NotificationsBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    initNotifications()

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const channel = supabase.channel('my-notifications')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          (payload) => {
            if (!payload.new.is_read) {
              setUnreadCount(prev => prev + 1)
              toast(payload.new.title, { description: payload.new.body })
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          (payload) => {
            if (payload.new.is_read && !payload.old.is_read) {
              setUnreadCount(prev => Math.max(0, prev - 1))
            }
          }
        )
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }

    const cleanup = setupRealtime()
    return () => { cleanup.then(c => c && c()) }
  }, [])

  const initNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 1. Fetch unread count
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
      
    if (count !== null) setUnreadCount(count)

    // 2. Request FCM permissions & save token if needed
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('verified_status, fcm_token')
        .eq('id', user.id)
        .single()

      if (profile && profile.verified_status !== 'PARTIAL') {
        const token = await requestFirebaseToken()
        if (token && token !== profile.fcm_token) {
          await fetch('/api/profile/fcm-token', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fcm_token: token })
          })
        }

        // Setup foreground FCM listener
        onMessageListener().then((payload: any) => {
          if (!payload) return // Firebase not configured
          toast(payload.notification?.title || 'New Notification', {
            description: payload.notification?.body,
          })
        }).catch(() => { /* Firebase optional — ignore */ })
      }
    } catch {
      // Firebase notifications are optional — fail silently
    }
  }

  return (
    <Link href="/notifications" className="relative p-2 rounded-full hover:bg-navy/5 transition-colors">
      <Bell className="w-6 h-6 text-navy" />
      {unreadCount > 0 && (
        <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-coral text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
