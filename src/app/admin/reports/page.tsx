import { supabaseAdmin } from '@/lib/supabase/admin'
import { ReportsClient } from './client'

export const dynamic = 'force-dynamic'

export default async function ReportsAdminPage() {
  // Fetch all reports with reporter profile joined
  const { data: rawReports } = await supabaseAdmin
    .from('reports')
    .select(`
      *,
      reporter:reporter_id ( name, email )
    `)
    .order('created_at', { ascending: false })

  const reports = rawReports || []

  // For LISTING reports → fetch the listing title in one batch query
  const listingIds = [...new Set(
    reports.filter(r => r.target_type === 'LISTING').map(r => r.target_id)
  )]
  const { data: listingsData } = listingIds.length > 0
    ? await supabaseAdmin
        .from('listings')
        .select('id, title, is_active')
        .in('id', listingIds)
    : { data: [] }
  const listingMap: Record<string, { title: string; is_active: boolean }> = {}
  for (const l of listingsData || []) listingMap[l.id] = { title: l.title, is_active: l.is_active }

  // For USER reports → fetch the reported user profile in one batch query
  const userIds = [...new Set(
    reports.filter(r => r.target_type === 'USER').map(r => r.target_id)
  )]
  const { data: usersData } = userIds.length > 0
    ? await supabaseAdmin
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds)
    : { data: [] }
  const userMap: Record<string, { name: string; email: string }> = {}
  for (const u of usersData || []) userMap[u.id] = { name: u.name, email: u.email }

  // Enrich each report with resolved target label + listing active status
  const enrichedReports = reports.map(r => ({
    ...r,
    target_label: r.target_type === 'LISTING'
      ? (listingMap[r.target_id]?.title ?? `Listing ${r.target_id.slice(0, 8)}…`)
      : (userMap[r.target_id]?.name ?? `User ${r.target_id.slice(0, 8)}…`),
    target_email: r.target_type === 'USER' ? userMap[r.target_id]?.email : null,
    // Lets the client show "Restore" button when a listing was removed
    listing_is_active: r.target_type === 'LISTING' ? (listingMap[r.target_id]?.is_active ?? null) : null,
  }))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl md:text-2xl font-black text-navy">Reports Queue</h1>
        <div className="flex gap-2 text-xs ml-auto">
          <span className="px-2.5 py-1 rounded-full bg-danger/10 text-danger font-semibold">
            {enrichedReports.filter(r => r.status === 'OPEN').length} Open
          </span>
          <span className="px-2.5 py-1 rounded-full bg-muted-bg text-text-muted font-semibold">
            {enrichedReports.filter(r => r.status === 'REVIEWING').length} Reviewing
          </span>
        </div>
      </div>
      <ReportsClient initialReports={enrichedReports} />
    </div>
  )
}
