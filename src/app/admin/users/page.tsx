import { supabaseAdmin } from '@/lib/supabase/admin'
import { UsersClient } from './client'

export const dynamic = 'force-dynamic'

export default async function UsersAdminPage() {
  const { data: users } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-5">
      <h1 className="text-xl md:text-2xl font-black text-navy">User Management</h1>
      <UsersClient initialUsers={users || []} />
    </div>
  )
}
