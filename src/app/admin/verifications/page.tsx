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
    <div>
      <h1 className="text-3xl font-black text-navy mb-8">Verification Queue</h1>
      <VerificationsClient initialProfiles={profiles || []} />
    </div>
  )
}
