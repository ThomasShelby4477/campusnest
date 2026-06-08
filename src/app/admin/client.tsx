'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import {
  Users, UserCheck, Home, AlertTriangle, UserPlus,
  Heart, MessageCircle, TrendingUp, ArrowUpRight, ArrowDownRight
} from 'lucide-react'

const PIE_COLORS = ['#1E3A5F', '#E8593C', '#10B981', '#F59E0B', '#6366F1', '#EC4899']

interface Props {
  kpis: {
    totalUsers: number
    pendingVerifications: number
    activeListings: number
    openReports: number
    signupsToday: number
    signupsYesterday: number
    totalMatches: number
    totalMessages: number
    verifiedUsers: number
    listingsTotal: number
  }
  lineChartData: any[]
  areaChartData: any[]
  barChartData: any[]
  roleChartData: any[]
  recentUsers: any[]
}

function KPICard({
  label, value, icon: Icon, color, trend,
}: {
  label: string
  value: string | number
  icon: any
  color: string
  trend?: { value: number; positive: boolean }
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98]">
      <div className="flex items-start justify-between mb-2.5">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-[11px] font-bold ${trend.positive ? 'text-emerald-500' : 'text-red-500'}`}>
            {trend.positive
              ? <ArrowUpRight className="w-3 h-3" />
              : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <p className="text-xl sm:text-2xl font-black text-navy leading-none">{value}</p>
      <p className="text-[11px] font-medium text-gray-400 mt-1 leading-tight">{label}</p>
    </div>
  )
}

/* ─── Lightweight chart tooltip style ─── */
const tooltipStyle = {
  borderRadius: '10px',
  border: '1px solid #E2E8F0',
  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
  fontSize: '12px',
}

export function AdminDashboardClient({
  kpis, lineChartData, areaChartData, barChartData, roleChartData, recentUsers
}: Props) {
  const sigTrend = kpis.signupsYesterday > 0
    ? {
        value: Math.round((kpis.signupsToday / kpis.signupsYesterday - 1) * 100),
        positive: kpis.signupsToday >= kpis.signupsYesterday,
      }
    : undefined

  const verifRate = kpis.totalUsers > 0
    ? Math.round((kpis.verifiedUsers / kpis.totalUsers) * 100)
    : 0

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-navy leading-tight">Dashboard</h1>
          <p className="text-xs text-gray-400 mt-0.5">Platform overview &amp; analytics</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-white border border-gray-100 px-3 py-1.5 rounded-2xl shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="hidden sm:inline">Live data</span>
          <span className="sm:hidden">Live</span>
        </div>
      </div>

      {/* ── Primary KPIs (5 cards) ────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        <KPICard label="Total Users"     value={kpis.totalUsers}        icon={Users}         color="bg-navy/10 text-navy"        />
        <KPICard label="Verified"         value={`${verifRate}%`}        icon={UserCheck}     color="bg-emerald-50 text-emerald-600" />
        <KPICard label="Pending Verifs"   value={kpis.pendingVerifications} icon={AlertTriangle} color="bg-amber-50 text-amber-500"   />
        <KPICard label="Active Listings"  value={kpis.activeListings}    icon={Home}          color="bg-coral/10 text-coral"      />
        <KPICard label="Signups Today"    value={kpis.signupsToday}      icon={UserPlus}      color="bg-navy/10 text-navy"        trend={sigTrend} />
      </div>

      {/* ── Secondary KPIs (4 cards) ─────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <KPICard label="Total Matches"  value={kpis.totalMatches}  icon={Heart}          color="bg-coral/10 text-coral"  />
        <KPICard label="Messages Sent"  value={kpis.totalMessages}  icon={MessageCircle}  color="bg-navy/10 text-navy"    />
        <KPICard label="Total Listings" value={kpis.listingsTotal}  icon={Home}           color="bg-coral/10 text-coral"  />
        <KPICard label="Open Reports"   value={kpis.openReports}    icon={AlertTriangle}  color="bg-red-50 text-red-500"  />
      </div>

      {/* ── Charts Row 1 ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area chart — user growth */}
        <Card className="lg:col-span-2 rounded-2xl border-gray-100 shadow-sm">
          <CardHeader className="pb-1 px-5 pt-5">
            <CardTitle className="text-sm font-bold text-navy flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-coral" />
              Cumulative User Growth
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[220px] sm:h-[260px] px-2 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="ugGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#E8593C" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#E8593C" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#CBD5E1" interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} stroke="#CBD5E1" />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="total" stroke="#E8593C" strokeWidth={2} fill="url(#ugGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie chart — users by role */}
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader className="pb-1 px-5 pt-5">
            <CardTitle className="text-sm font-bold text-navy">Users by Role</CardTitle>
          </CardHeader>
          <CardContent className="h-[220px] sm:h-[260px] flex flex-col pb-4">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleChartData}
                    cx="50%" cy="48%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {roleChartData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-2">
              {roleChartData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1 text-[11px]">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-gray-500 font-medium">{d.name}</span>
                  <span className="font-bold text-navy">{d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Charts Row 2 ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Line chart — daily signups */}
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader className="pb-1 px-5 pt-5">
            <CardTitle className="text-sm font-bold text-navy flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-navy" />
              Daily Signups (30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] sm:h-[240px] px-2 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#CBD5E1" interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} stroke="#CBD5E1" allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="signups" stroke="#1E3A5F" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#1E3A5F' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar chart — listings by room type */}
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader className="pb-1 px-5 pt-5">
            <CardTitle className="text-sm font-bold text-navy flex items-center gap-2">
              <Home className="w-4 h-4 text-coral" />
              Listings by Room Type
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] sm:h-[240px] px-2 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} barCategoryGap="28%" margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="type" tick={{ fontSize: 10 }} stroke="#CBD5E1" />
                <YAxis tick={{ fontSize: 10 }} stroke="#CBD5E1" allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#F8FAFC' }} />
                <Bar dataKey="count" fill="#E8593C" radius={[5, 5, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Registrations ───────────────────────── */}
      <Card className="rounded-2xl border-gray-100 shadow-sm">
        <CardHeader className="pb-1 px-5 pt-5">
          <CardTitle className="text-sm font-bold text-navy">Recent Registrations</CardTitle>
          <p className="text-[11px] text-gray-400 mt-0.5">Latest 10 users who joined the platform</p>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-2.5 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">User</th>
                  <th className="py-2.5 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="py-2.5 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="py-2.5 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u: any) => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-5 text-sm font-semibold text-navy">{u.name || 'Unnamed'}</td>
                    <td className="py-3 px-5 text-sm text-gray-400 truncate max-w-[180px]">{u.email}</td>
                    <td className="py-3 px-5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                        ${u.role === 'ADMIN'    ? 'bg-navy/10 text-navy'
                        : u.role === 'LANDLORD' ? 'bg-coral/10 text-coral'
                        : 'bg-gray-100 text-gray-500'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-xs text-gray-400 text-right">
                      {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="sm:hidden divide-y divide-gray-50">
            {recentUsers.map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-xl bg-navy/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-black text-navy">
                    {(u.name || '?')[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-navy truncate">{u.name || 'Unnamed'}</p>
                  <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full
                    ${u.role === 'ADMIN'    ? 'bg-navy/10 text-navy'
                    : u.role === 'LANDLORD' ? 'bg-coral/10 text-coral'
                    : 'bg-gray-100 text-gray-500'}`}>
                    {u.role}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
