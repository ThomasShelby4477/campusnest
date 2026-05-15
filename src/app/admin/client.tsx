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
    <div className="bg-white rounded-3xl border border-border-light p-5 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-bold ${trend.positive ? 'text-success' : 'text-danger'}`}>
            {trend.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend.value}%
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-navy">{value}</p>
      <p className="text-xs font-medium text-text-muted mt-1">{label}</p>
    </div>
  )
}

export function AdminDashboardClient({ kpis, lineChartData, areaChartData, barChartData, roleChartData, recentUsers }: Props) {
  const sigTrend = kpis.signupsYesterday > 0
    ? { value: Math.round((kpis.signupsToday / kpis.signupsYesterday - 1) * 100), positive: kpis.signupsToday >= kpis.signupsYesterday }
    : undefined

  const verifRate = kpis.totalUsers > 0 ? Math.round((kpis.verifiedUsers / kpis.totalUsers) * 100) : 0

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
          <p className="text-sm text-text-muted mt-0.5">Platform overview &amp; analytics</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted bg-white border border-border-light px-3 py-1.5 rounded-2xl">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          Live data
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KPICard label="Total Users" value={kpis.totalUsers} icon={Users} color="bg-navy/10 text-navy" />
        <KPICard label="Verified" value={`${verifRate}%`} icon={UserCheck} color="bg-success/10 text-success" />
        <KPICard label="Pending Verifs" value={kpis.pendingVerifications} icon={AlertTriangle} color="bg-warning/10 text-warning" />
        <KPICard label="Active Listings" value={kpis.activeListings} icon={Home} color="bg-coral/10 text-coral" />
        <KPICard label="Signups Today" value={kpis.signupsToday} icon={UserPlus} color="bg-navy/10 text-navy" trend={sigTrend} />
      </div>

      {/* Secondary KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Total Matches" value={kpis.totalMatches} icon={Heart} color="bg-coral/10 text-coral" />
        <KPICard label="Messages Sent" value={kpis.totalMessages} icon={MessageCircle} color="bg-navy/10 text-navy" />
        <KPICard label="Total Listings" value={kpis.listingsTotal} icon={Home} color="bg-coral/10 text-coral" />
        <KPICard label="Open Reports" value={kpis.openReports} icon={AlertTriangle} color="bg-danger/10 text-danger" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Growth (Area) */}
        <Card className="lg:col-span-2 rounded-3xl border-border-light shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-navy flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-coral" />
              Cumulative User Growth
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaChartData}>
                <defs>
                  <linearGradient id="userGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E8593C" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#E8593C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94A3B8" interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }} />
                <Area type="monotone" dataKey="total" stroke="#E8593C" strokeWidth={2.5} fill="url(#userGrowthGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Roles (Pie) */}
        <Card className="rounded-3xl border-border-light shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-navy">Users by Role</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleChartData}
                  cx="50%" cy="45%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {roleChartData.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 -mt-2">
              {roleChartData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-text-muted font-medium">{d.name}</span>
                  <span className="font-bold text-navy">{d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Signups Line Chart */}
        <Card className="rounded-3xl border-border-light shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-navy flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-navy" />
              Daily Signups (30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94A3B8" interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }} />
                <Line type="monotone" dataKey="signups" stroke="#1E3A5F" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#1E3A5F' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Listings Bar Chart */}
        <Card className="rounded-3xl border-border-light shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-navy flex items-center gap-2">
              <Home className="w-4 h-4 text-coral" />
              Listings by Room Type
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="type" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }} cursor={{ fill: '#F8FAFC' }} />
                <Bar dataKey="count" fill="#E8593C" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="rounded-3xl border-border-light shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-navy">Recent Registrations</CardTitle>
          <p className="text-xs text-text-muted mt-0.5">Latest 10 users who joined the platform</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-light">
                  <th className="py-3 px-3 text-xs font-bold text-text-muted uppercase tracking-wider">User</th>
                  <th className="py-3 px-3 text-xs font-bold text-text-muted uppercase tracking-wider hidden sm:table-cell">Email</th>
                  <th className="py-3 px-3 text-xs font-bold text-text-muted uppercase tracking-wider">Role</th>
                  <th className="py-3 px-3 text-xs font-bold text-text-muted uppercase tracking-wider text-right">Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u: any) => (
                  <tr key={u.id} className="border-b border-border-light/50 hover:bg-muted-bg/50 transition-colors">
                    <td className="py-3 px-3 text-sm font-semibold text-navy">{u.name || 'Unnamed'}</td>
                    <td className="py-3 px-3 text-sm text-text-muted hidden sm:table-cell truncate max-w-[200px]">{u.email}</td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.role === 'ADMIN' ? 'bg-navy/10 text-navy' : u.role === 'LANDLORD' ? 'bg-coral/10 text-coral' : 'bg-muted-bg text-text-muted'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs text-text-muted text-right">
                      {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
