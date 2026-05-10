import { supabaseAdmin } from '@/lib/supabase/admin'
import { AdminDashboardClient } from './client'

export default async function AdminDashboard() {
  // Fetch KPIs
  const [{ count: totalUsers }, { count: pendingVerifications }, { count: activeListings }, { count: openReports }] = await Promise.all([
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('verified_status', 'PENDING'),
    supabaseAdmin.from('listings').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabaseAdmin.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'OPEN'),
  ])

  // New signups today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { count: signupsToday } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString())

  // Signups per day (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const { data: recentSignups } = await supabaseAdmin
    .from('profiles')
    .select('created_at')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true })

  const signupsByDate = recentSignups?.reduce((acc: any, curr: any) => {
    const date = new Date(curr.created_at).toISOString().split('T')[0]
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {})

  const lineChartData = Object.keys(signupsByDate || {}).map(date => ({
    date,
    signups: signupsByDate[date]
  }))

  // Listings by room_type
  const { data: listings } = await supabaseAdmin
    .from('listings')
    .select('room_type')
    .eq('is_active', true)

  const listingsByType = listings?.reduce((acc: any, curr: any) => {
    acc[curr.room_type] = (acc[curr.room_type] || 0) + 1
    return acc
  }, {})

  const barChartData = Object.keys(listingsByType || {}).map(type => ({
    type,
    count: listingsByType[type]
  }))

  const kpis = {
    totalUsers: totalUsers || 0,
    pendingVerifications: pendingVerifications || 0,
    activeListings: activeListings || 0,
    openReports: openReports || 0,
    signupsToday: signupsToday || 0,
  }

  return <AdminDashboardClient kpis={kpis} lineChartData={lineChartData} barChartData={barChartData} />
}
