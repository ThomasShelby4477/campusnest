import { supabaseAdmin } from '@/lib/supabase/admin'
import { AdminDashboardClient } from './client'

export default async function AdminDashboard() {
  // Fetch KPIs in parallel
  const [
    { count: totalUsers },
    { count: pendingVerifications },
    { count: activeListings },
    { count: openReports },
    { count: totalMatches },
    { count: totalMessages },
    userRoleBreakdown,
    { count: listingsTotal },
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('verified_status', 'PENDING'),
    supabaseAdmin.from('listings').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabaseAdmin.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'OPEN'),
    supabaseAdmin.from('matches').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('messages').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('profiles').select('role'),
    supabaseAdmin.from('listings').select('*', { count: 'exact', head: true }),
  ])

  // Users by role
  const roleCounts = (userRoleBreakdown.data || []).reduce((acc: Record<string, number>, p: any) => {
    acc[p.role] = (acc[p.role] || 0) + 1
    return acc
  }, {})

  const roleChartData = Object.entries(roleCounts).map(([name, value]) => ({ name, value }))

  // Signups today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { count: signupsToday } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString())

  // Yesterday's signups for comparison
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const { count: signupsYesterday } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', yesterday.toISOString())
    .lt('created_at', today.toISOString())

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
    date: new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    signups: signupsByDate[date]
  }))

  // Cumulative user growth
  let cumTotal = 0
  const areaChartData = lineChartData.map(d => {
    cumTotal += d.signups
    return { ...d, total: cumTotal }
  })

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

  // Verified vs total users
  const { count: verifiedUsers } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('verified_status', 'VERIFIED')

  // Recent activity: last 10 profiles registered
  const { data: recentUsers } = await supabaseAdmin
    .from('profiles')
    .select('id, name, email, role, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  const kpis = {
    totalUsers: totalUsers || 0,
    pendingVerifications: pendingVerifications || 0,
    activeListings: activeListings || 0,
    openReports: openReports || 0,
    signupsToday: signupsToday || 0,
    signupsYesterday: signupsYesterday || 0,
    totalMatches: totalMatches || 0,
    totalMessages: totalMessages || 0,
    verifiedUsers: verifiedUsers || 0,
    listingsTotal: listingsTotal || 0,
  }

  return (
    <AdminDashboardClient
      kpis={kpis}
      lineChartData={lineChartData}
      areaChartData={areaChartData}
      barChartData={barChartData}
      roleChartData={roleChartData}
      recentUsers={recentUsers || []}
    />
  )
}
