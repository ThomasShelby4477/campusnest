'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import { Users, UserCheck, Home, AlertTriangle, UserPlus, Heart, MessageCircle, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react'

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

function KPICard({ label, value, icon: Icon, color, trend }: {
  label: string; value: string | number; icon: any; color: string; trend?: { value: number; positive: boolean }
}) {
  return (
    <div className="bg-white rounded-2xl border border-border-light p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-bold ${trend.positive ? 'text-success' : 'text-danger'}`}>
            {trend.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-navy leading-none">{value}</p>
      <p className="text-[11px] font-medium text-text-muted mt-1.5 leading-tight">{label}</p>
    </div>
  )
}

export function AdminDashboardClient({ kpis, lineChartData, areaChartData, barChartData, roleChartData, recentUsers }: Props) {
  const sigTrend = kpis.signupsYesterday > 0
    ? { value: Math.round((kpis.signupsToday / kpis.signupsYesterday - 1) * 100), positive: kpis.signupsToday >= kpis.signupsYesterday }
    : undefined

  const verifRate = kpis.totalUsers > 0 ? Math.round((kpis.verifiedUsers / kpis.totalUsers) * 100) : 0

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-navy">Dashboard</h1>
          <p className="text-xs text-text-muted mt-0.5">Platform overview & analytics</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted bg-white border border-border-light px-3 py-1.5 rounded-2xl">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="hidden sm:inline">Live data</span>
        </div>
      </div>

      {/* KPI Grid — 2 cols on mobile, 3 on sm, 5 on lg */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KPICard label="Total Users" value={kpis.totalUsers} icon={Users} color="bg-navy/10 text-navy" />
        <KPICard label="Verified" value={`${verifRate}%`} icon={UserCheck} color="bg-success/10 text-success" />
        <KPICard label="Pending Verifs" value={kpis.pendingVerifications} icon={AlertTriangle} color="bg-warning/10 text-warning" />
        <KPICard label="Active Listings" value={kpis.activeListings} icon={Home} color="bg-coral/10 text-coral" />
        <KPICard label="Signups Today" value={kpis.signupsToday} icon={UserPlus} color="bg-navy/10 text-navy" trend={sigTrend} />
      </div>

      {/* Secondary KPI Row — 2 cols on mobile, 4 on sm */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard label="Total Matches" value={kpis.totalMatches} icon={Heart} color="bg-coral/10 text-coral" />
        <KPICard label="Messages Sent" value={kpis.totalMessages} icon={MessageCircle} color="bg-navy/10 text-navy" />
        <KPICard label="Total Listings" value={kpis.listingsTotal} icon={Home} color="bg-coral/10 text-coral" />
        <KPICard label="Open Reports" value={kpis.openReports} icon={AlertTriangle} color="bg-danger/10 text-danger" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* User Growth (Area) */}
        <Card className="lg:col-span-2 rounded-2xl border-border-light shadow-sm">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-bold text-navy flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-coral" />
              Cumulative User Growth
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[220px] md:h-[280px] px-2 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaChartData}>
                <defs>
                  <linearGradient id="userGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E8593C" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#E8593C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94A3B8" interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" width={28} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', fontSize: '12px' }} />
                <Area type="monotone" dataKey="total" stroke="#E8593C" strokeWidth={2.5} fill="url(#userGrowthGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Roles (Pie) */}
        <Card className="rounded-2xl border-border-light shadow-sm">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-bold text-navy">Users by Role</CardTitle>
          </CardHeader>
          <CardContent className="h-[220px] md:h-[280px] px-2 pb-4">
            <ResponsiveContainer width="100%" height="75%">
              <PieChart>
                <Pie
                  data={roleChartData}
                  cx="50%" cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {roleChartData.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-1">
              {roleChartData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-text-muted font-medium">{d.name}</span>
                  <span className="font-bold text-navy">{d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Signups Line Chart */}
        <Card className="rounded-2xl border-border-light shadow-sm">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-bold text-navy flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-navy" />
              Daily Signups (30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] md:h-[240px] px-2 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94A3B8" interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" allowDecimals={false} width={24} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', fontSize: '12px' }} />
                <Line type="monotone" dataKey="signups" stroke="#1E3A5F" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#1E3A5F' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Listings Bar Chart */}
        <Card className="rounded-2xl border-border-light shadow-sm">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-bold text-navy flex items-center gap-2">
              <Home className="w-4 h-4 text-coral" />
              Listings by Room Type
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] md:h-[240px] px-2 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="type" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" allowDecimals={false} width={24} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', fontSize: '12px' }} cursor={{ fill: '#F8FAFC' }} />
                <Bar dataKey="count" fill="#E8593C" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="rounded-2xl border-border-light shadow-sm">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-bold text-navy">Recent Registrations</CardTitle>
          <p className="text-xs text-text-muted mt-0.5">Latest 10 users who joined the platform</p>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-light">
                  <th className="py-3 px-4 text-xs font-bold text-text-muted uppercase tracking-wider">User</th>
                  <th className="py-3 px-4 text-xs font-bold text-text-muted uppercase tracking-wider">Email</th>
                  <th className="py-3 px-4 text-xs font-bold text-text-muted uppercase tracking-wider">Role</th>
                  <th className="py-3 px-4 text-xs font-bold text-text-muted uppercase tracking-wider text-right">Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u: any) => (
                  <tr key={u.id} className="border-b border-border-light/50 hover:bg-muted-bg/50 transition-colors">
                    <td className="py-3 px-4 text-sm font-semibold text-navy">{u.name || 'Unnamed'}</td>
                    <td className="py-3 px-4 text-sm text-text-muted truncate max-w-[200px]">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.role === 'ADMIN' ? 'bg-navy/10 text-navy' : u.role === 'LANDLORD' ? 'bg-coral/10 text-coral' : 'bg-muted-bg text-text-muted'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-text-muted text-right">
                      {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="sm:hidden divide-y divide-border-light">
            {recentUsers.map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-xl bg-navy/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-black text-navy">{(u.name || '?')[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy truncate">{u.name || 'Unnamed'}</p>
                  <p className="text-xs text-text-muted truncate">{u.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${u.role === 'ADMIN' ? 'bg-navy/10 text-navy' : u.role === 'LANDLORD' ? 'bg-coral/10 text-coral' : 'bg-muted-bg text-text-muted'}`}>
                    {u.role}
                  </span>
                  <span className="text-[10px] text-text-muted">
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
