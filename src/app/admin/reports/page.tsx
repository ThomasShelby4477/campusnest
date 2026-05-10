import { supabaseAdmin } from '@/lib/supabase/admin'
import { ReportsClient } from './client'

export const dynamic = 'force-dynamic'

export default async function ReportsAdminPage() {
  const { data: reports } = await supabaseAdmin
    .from('reports')
    .select(`
      *,
      reporter:reporter_id(name, email),
      reported:reported_id(name, email)
    `)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-3xl font-black text-navy mb-8">Reports Queue</h1>
      <ReportsClient initialReports={reports || []} />
    </div>
  )
}
