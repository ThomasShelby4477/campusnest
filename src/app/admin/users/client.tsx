'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Shield, Ban, CheckCircle, Search, ChevronDown, ChevronUp,
  ArrowUpDown, SlidersHorizontal, Calendar, User,
} from 'lucide-react'

type SortKey = 'newest' | 'oldest' | 'name_az' | 'name_za'

export function UsersClient({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [verifiedFilter, setVerifiedFilter] = useState('ALL')
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [sort, setSort] = useState<SortKey>('newest')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const supabase = createClient()

  const handleSuspendToggle = async (userId: string, currentlyActive: boolean) => {
    setLoadingId(userId)
    const endpoint = currentlyActive
      ? '/api/admin/suspend-user'
      : '/api/admin/unsuspend-user'
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, is_active: !currentlyActive } : u
      ))
      toast.success(currentlyActive ? 'User suspended' : 'User unsuspended')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user')
    }
    setLoadingId(null)
  }

  const handleAction = async (userId: string, updates: any) => {
    setLoadingId(userId)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId)
    if (error) {
      toast.error('Failed to update user')
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u))
      toast.success('User updated successfully')
    }
    setLoadingId(null)
  }

  // ── Filtered + sorted list ────────────────────────────────────
  const filtered = useMemo(() => {
    let list = users

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(u =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.branch || '').toLowerCase().includes(q)
      )
    }
    if (roleFilter !== 'ALL') list = list.filter(u => u.role === roleFilter)
    if (verifiedFilter !== 'ALL') list = list.filter(u => u.verified_status === verifiedFilter)
    if (activeFilter === 'ACTIVE') list = list.filter(u => u.is_active !== false)
    if (activeFilter === 'SUSPENDED') list = list.filter(u => u.is_active === false)

    list = [...list].sort((a, b) => {
      if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sort === 'name_az') return (a.name || '').localeCompare(b.name || '')
      if (sort === 'name_za') return (b.name || '').localeCompare(a.name || '')
      return 0
    })
    return list
  }, [users, search, roleFilter, verifiedFilter, activeFilter, sort])

  const hasActiveFilter = search || roleFilter !== 'ALL' || verifiedFilter !== 'ALL' || activeFilter !== 'ALL'

  // ── Summary counts ────────────────────────────────────────────
  const counts = {
    total: users.length,
    admins: users.filter(u => u.role === 'ADMIN').length,
    verified: users.filter(u => u.verified_status === 'VERIFIED').length,
    suspended: users.filter(u => u.is_active === false).length,

    pending: users.filter(u => u.verified_status === 'PENDING').length,
  }

  return (
    <div className="space-y-4">

      {/* ── Stats strip ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Users', value: counts.total, color: 'bg-navy/10 text-navy' },
          { label: 'Verified', value: counts.verified, color: 'bg-success/10 text-success' },
          { label: 'Pending', value: counts.pending, color: 'bg-warning/10 text-warning' },
          { label: 'Suspended', value: counts.suspended, color: 'bg-danger/10 text-danger' },

        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-border-light px-4 py-3 shadow-sm">
            <p className={`text-xl font-black ${s.color.split(' ')[1]}`}>{s.value}</p>
            <p className="text-xs text-text-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Search + Filters bar ──────────────────────────────── */}
      <div className="bg-white border border-border-light rounded-2xl p-3 space-y-3 shadow-sm">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Search by name, email or branch…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-muted-bg border-0 focus-visible:ring-1"
          />
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Role */}
          <Select value={roleFilter} onValueChange={v => setRoleFilter(v ?? 'ALL')}>
            <SelectTrigger className="h-9 w-[120px] rounded-xl bg-muted-bg border-0 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5 mr-1.5 text-text-muted" />
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="LANDLORD">Landlord</SelectItem>
            </SelectContent>
          </Select>

          {/* Verified status */}
          <Select value={verifiedFilter} onValueChange={v => setVerifiedFilter(v ?? 'ALL')}>
            <SelectTrigger className="h-9 w-[130px] rounded-xl bg-muted-bg border-0 text-xs font-semibold">
              <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-text-muted" />
              <SelectValue placeholder="Verified" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="VERIFIED">Verified</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>

          {/* Active/Banned */}
          <Select value={activeFilter} onValueChange={v => setActiveFilter(v ?? 'ALL')}>
            <SelectTrigger className="h-9 w-[120px] rounded-xl bg-muted-bg border-0 text-xs font-semibold">
              <User className="w-3.5 h-3.5 mr-1.5 text-text-muted" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Users</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>

            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sort} onValueChange={v => setSort((v ?? 'newest') as SortKey)}>
            <SelectTrigger className="h-9 w-[140px] rounded-xl bg-muted-bg border-0 text-xs font-semibold">
              <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-text-muted" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="name_az">Name A → Z</SelectItem>
              <SelectItem value="name_za">Name Z → A</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilter && (
            <button
              onClick={() => { setSearch(''); setRoleFilter('ALL'); setVerifiedFilter('ALL'); setActiveFilter('ALL') }}
              className="h-9 px-3 rounded-xl text-xs font-semibold text-coral hover:bg-coral/5 transition-colors border border-coral/20"
            >
              Clear filters
            </button>
          )}

          <span className="ml-auto self-center text-xs font-semibold text-text-muted whitespace-nowrap">
            {filtered.length} / {users.length} users
          </span>
        </div>
      </div>

      {/* ── Desktop Table ─────────────────────────────────── */}
      <div className="hidden md:block bg-white rounded-2xl border border-border-light overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-text-muted text-sm">
            <SlidersHorizontal className="w-8 h-8 mx-auto mb-3 opacity-30" />
            No users match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-muted-bg/50 border-b border-border-light">
                  <th className="p-4 font-bold text-navy text-sm">User</th>
                  <th className="p-4 font-bold text-navy text-sm">Joined</th>
                  <th className="p-4 font-bold text-navy text-sm">Role</th>
                  <th className="p-4 font-bold text-navy text-sm">Status</th>
                  <th className="p-4 font-bold text-navy text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {filtered.map(u => (
                  <tr key={u.id} className={`hover:bg-muted-bg/30 transition-colors ${!u.is_active ? 'opacity-50' : ''}`}>
                    <td className="p-4">
                      <div className="font-bold text-text-primary">{u.name || '—'}</div>
                      <div className="text-xs text-text-muted">{u.email}</div>
                    </td>
                    <td className="p-4 text-xs text-text-muted whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${u.role === 'ADMIN' ? 'bg-navy/10 text-navy' : u.role === 'LANDLORD' ? 'bg-coral/10 text-coral' : 'bg-muted-bg text-text-muted'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 flex-wrap">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${u.verified_status === 'VERIFIED' ? 'bg-success/10 text-success' : u.verified_status === 'REJECTED' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
                          {u.verified_status}
                        </span>
                        {!u.is_active && (
                          <span className="text-xs font-bold px-2 py-1 rounded-full bg-danger/10 text-danger">Suspended</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-end flex-wrap">
                        <Button variant="outline" size="sm" disabled={loadingId === u.id}
                          onClick={() => handleAction(u.id, { role: u.role === 'ADMIN' ? 'USER' : 'ADMIN' })}
                          className="text-xs rounded-lg">
                          <Shield className="w-3.5 h-3.5 mr-1" />
                          {u.role === 'ADMIN' ? 'Revoke Admin' : 'Make Admin'}
                        </Button>
                        <Button variant="outline" size="sm"
                          className="bg-white border-success text-success hover:bg-success/5 hover:text-success text-xs rounded-lg"
                          disabled={loadingId === u.id || u.verified_status === 'VERIFIED'}
                          onClick={() => handleAction(u.id, { verified_status: 'VERIFIED' })}>
                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Force Verify
                        </Button>
                        <Button variant={u.is_active ? 'destructive' : 'outline'} size="sm"
                          disabled={loadingId === u.id}
                          onClick={() => handleSuspendToggle(u.id, u.is_active !== false)}>
                          <Ban className="w-3.5 h-3.5 mr-1" /> {u.is_active !== false ? 'Suspend' : 'Unsuspend'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Mobile Card List ───────────────────────────────── */}
      <div className="md:hidden space-y-2.5">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border-light p-10 text-center text-text-muted text-sm">
            <SlidersHorizontal className="w-8 h-8 mx-auto mb-3 opacity-30" />
            No users match your filters.
          </div>
        ) : (
          filtered.map(u => {
            const isExpanded = expandedId === u.id
            const isLoading = loadingId === u.id
            return (
              <div key={u.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${!u.is_active ? 'opacity-70 border-danger/20' : 'border-border-light'}`}>
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : u.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted-bg/40 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-navy/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-black text-navy">{(u.name || '?')[0]?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-navy truncate text-sm">{u.name || 'Unnamed'}</p>
                    <p className="text-xs text-text-muted truncate">{u.email}</p>
                    <p className="text-[10px] text-text-muted mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${u.role === 'ADMIN' ? 'bg-navy/10 text-navy' : u.role === 'LANDLORD' ? 'bg-coral/10 text-coral' : 'bg-muted-bg text-text-muted'}`}>{u.role}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${u.verified_status === 'VERIFIED' ? 'bg-success/10 text-success' : u.verified_status === 'REJECTED' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>{u.verified_status}</span>
                    {!u.is_active && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-danger/10 text-danger">Suspended</span>}

                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted shrink-0" /> : <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-border-light bg-muted-bg/30 p-4 space-y-2">
                    <Button variant="outline" size="sm" className="w-full h-10 rounded-xl justify-start text-sm" disabled={isLoading}
                      onClick={() => handleAction(u.id, { role: u.role === 'ADMIN' ? 'USER' : 'ADMIN' })}>
                      <Shield className="w-4 h-4 mr-2" /> {u.role === 'ADMIN' ? 'Revoke Admin' : 'Make Admin'}
                    </Button>
                    <Button variant="outline" size="sm" className="w-full h-10 rounded-xl justify-start text-sm border-success text-success hover:bg-success/5"
                      disabled={isLoading || u.verified_status === 'VERIFIED'}
                      onClick={() => handleAction(u.id, { verified_status: 'VERIFIED' })}>
                      <CheckCircle className="w-4 h-4 mr-2" /> Force Verify
                    </Button>
                    <Button variant={u.is_active ? 'destructive' : 'outline'} size="sm" className="w-full h-10 rounded-xl justify-start text-sm"
                      disabled={isLoading}
                      onClick={() => handleSuspendToggle(u.id, u.is_active !== false)}>
                      <Ban className="w-4 h-4 mr-2" /> {u.is_active !== false ? 'Suspend User' : 'Unsuspend User'}
                    </Button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
