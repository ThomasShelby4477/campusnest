import { supabaseAdmin } from '@/lib/supabase/admin'
import { UsersClient } from './client'

export const dynamic = 'force-dynamic'

export default async function UsersAdminPage() {
  const { data: users } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-3xl font-black text-navy mb-8">User Management</h1>
      <UsersClient initialUsers={users || []} />
    </div>
  )
}
