import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NotificationsClient } from './client'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-[calc(100vh-64px)] bg-muted-bg pb-12">
      <div className="max-w-3xl mx-auto pt-8 px-4">
        <h1 className="text-3xl font-bold text-navy mb-6">Notifications</h1>
        <NotificationsClient initialNotifications={notifications || []} userId={user.id} />
      </div>
    </div>
  )
}
