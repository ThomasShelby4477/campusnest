import { supabaseAdmin } from '@/lib/supabase/admin'
import { VerificationsClient } from './client'

export const dynamic = 'force-dynamic'

export default async function VerificationsPage() {
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('verified_status', 'PENDING')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-5">
      <h1 className="text-xl md:text-2xl font-black text-navy">Verification Queue</h1>
      <VerificationsClient initialProfiles={profiles || []} />
    </div>
  )
}
