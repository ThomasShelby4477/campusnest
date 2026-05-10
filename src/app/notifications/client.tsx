'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, Check, CheckCircle2, MessageSquare, Heart, ShieldCheck, AlertCircle } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface Props {
  initialNotifications: any[]
  userId: string
}

export function NotificationsClient({ initialNotifications, userId }: Props) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const channel = supabase.channel('my-notifications-page')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, (payload) => {
        setNotifications(prev => [payload.new, ...prev])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, (payload) => {
        setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
  }

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notification.id)
    }
    if (notification.link) {
      router.push(notification.link)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'NEW_MATCH': return <Heart className="w-5 h-5 text-coral" />
      case 'NEW_MESSAGE': return <MessageSquare className="w-5 h-5 text-navy" />
      case 'VERIFICATION_APPROVED': return <ShieldCheck className="w-5 h-5 text-success" />
      case 'VERIFICATION_REJECTED': return <AlertCircle className="w-5 h-5 text-danger" />
      case 'LISTING_APPROVED': return <CheckCircle2 className="w-5 h-5 text-success" />
      default: return <Bell className="w-5 h-5 text-text-muted" />
    }
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon="notifications"
        title="You're all caught up!"
        description="No new notifications at the moment. We'll let you know when something happens."
      />
    )
  }

  const hasUnread = notifications.some(n => !n.is_read)

  return (
    <div className="bg-white rounded-2xl border border-border-light overflow-hidden shadow-sm">
      {hasUnread && (
        <div className="p-4 border-b border-border-light flex justify-end bg-muted-bg/50">
          <Button variant="outline" size="sm" onClick={markAllRead} className="flex gap-2">
            <Check className="w-4 h-4" /> Mark all read
          </Button>
        </div>
      )}
      <div className="divide-y divide-border-light">
        {notifications.map((n) => (
          <div 
            key={n.id} 
            onClick={() => handleNotificationClick(n)}
            className={`p-4 sm:p-6 flex gap-4 cursor-pointer transition-colors hover:bg-muted-bg ${!n.is_read ? 'bg-navy/5' : ''}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${!n.is_read ? 'bg-white shadow-sm' : 'bg-muted-bg'}`}>
              {getIcon(n.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-base font-bold text-text-primary mb-1 ${!n.is_read ? 'text-navy' : ''}`}>
                {n.title}
              </h3>
              <p className={`text-sm mb-2 ${!n.is_read ? 'text-text-primary font-medium' : 'text-text-muted'}`}>
                {n.body}
              </p>
              <span className="text-xs text-text-muted font-medium">
                {new Date(n.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>
            {!n.is_read && (
              <div className="w-2 h-2 rounded-full bg-coral mt-2 shrink-0 shadow-sm" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
