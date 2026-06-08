'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Shield, Ban, CheckCircle, Search, ChevronDown, ChevronUp } from 'lucide-react'

export function UsersClient({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const supabase = createClient()

  const handleAction = async (userId: string, updates: any) => {
    setLoadingId(userId)
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId)
    if (error) {
      toast.error('Failed to update user')
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u))
      toast.success('User updated successfully')
    }
    setLoadingId(null)
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.name || '').toLowerCase().includes(search.toLowerCase()) || (u.email || '').toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <div className="space-y-4">
      {/* Search + filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white rounded-xl"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v ?? 'ALL')}>
          <SelectTrigger className="w-full sm:w-[160px] bg-white rounded-xl">
            <SelectValue placeholder="Filter by Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Roles</SelectItem>
            <SelectItem value="USER">User</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs font-semibold text-text-muted self-center whitespace-nowrap">
          {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Desktop Table ─────────────────────────────────── */}
      <div className="hidden md:block bg-white rounded-2xl border border-border-light overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-muted-bg/50 border-b border-border-light">
                <th className="p-4 font-bold text-navy text-sm">User</th>
                <th className="p-4 font-bold text-navy text-sm">Role</th>
                <th className="p-4 font-bold text-navy text-sm">Status</th>
                <th className="p-4 font-bold text-navy text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {filteredUsers.map(u => (
                <tr key={u.id} className={`hover:bg-muted-bg/30 ${!u.is_active ? 'opacity-50' : ''}`}>
                  <td className="p-4">
                    <div className="font-bold text-text-primary">{u.name}</div>
                    <div className="text-xs text-text-muted">{u.email}</div>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${u.role === 'ADMIN' ? 'bg-navy/10 text-navy' : 'bg-muted-bg text-text-muted'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${u.verified_status === 'VERIFIED' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                        {u.verified_status}
                      </span>
                      {!u.is_active && (
                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-danger/10 text-danger">Banned</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2 justify-end flex-wrap">
                      <Button
                        variant="outline" size="sm"
                        disabled={loadingId === u.id}
                        onClick={() => handleAction(u.id, { role: u.role === 'ADMIN' ? 'USER' : 'ADMIN' })}
                        className="text-xs"
                      >
                        <Shield className="w-3.5 h-3.5 mr-1" />
                        {u.role === 'ADMIN' ? 'Revoke Admin' : 'Make Admin'}
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        className="bg-white border-success text-success hover:bg-success/5 hover:text-success text-xs"
                        disabled={loadingId === u.id || u.verified_status === 'VERIFIED'}
                        onClick={() => handleAction(u.id, { verified_status: 'VERIFIED' })}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Force Verify
                      </Button>
                      <Button
                        variant={u.is_active ? 'destructive' : 'outline'} size="sm"
                        disabled={loadingId === u.id}
                        onClick={() => handleAction(u.id, { is_active: !u.is_active })}
                        className="text-xs"
                      >
                        <Ban className="w-3.5 h-3.5 mr-1" /> {u.is_active ? 'Ban' : 'Unban'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile Card List ───────────────────────────────── */}
      <div className="md:hidden space-y-2.5">
        {filteredUsers.map(u => {
          const isExpanded = expandedId === u.id
          const isLoading = loadingId === u.id
          return (
            <div key={u.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${!u.is_active ? 'opacity-70 border-danger/20' : 'border-border-light'}`}>
              {/* Card header row — tap to expand */}
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : u.id)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted-bg/40 transition-colors"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-navy/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-black text-navy">{(u.name || '?')[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-navy truncate text-sm">{u.name || 'Unnamed'}</p>
                  <p className="text-xs text-text-muted truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${u.role === 'ADMIN' ? 'bg-navy/10 text-navy' : 'bg-muted-bg text-text-muted'}`}>
                      {u.role}
                    </span>
                    {!u.is_active && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-danger/10 text-danger">Banned</span>
                    )}
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                </div>
              </button>

              {/* Expanded actions */}
              {isExpanded && (
                <div className="border-t border-border-light bg-muted-bg/30 p-4 space-y-3">
                  {/* Status badges */}
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${u.verified_status === 'VERIFIED' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                      {u.verified_status}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${u.is_active ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                      {u.is_active ? 'Active' : 'Banned'}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant="outline" size="sm"
                      className="w-full h-10 rounded-xl justify-start text-sm"
                      disabled={isLoading}
                      onClick={() => handleAction(u.id, { role: u.role === 'ADMIN' ? 'USER' : 'ADMIN' })}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      {u.role === 'ADMIN' ? 'Revoke Admin' : 'Make Admin'}
                    </Button>
                    <Button
                      variant="outline" size="sm"
                      className="w-full h-10 rounded-xl justify-start text-sm border-success text-success hover:bg-success/5"
                      disabled={isLoading || u.verified_status === 'VERIFIED'}
                      onClick={() => handleAction(u.id, { verified_status: 'VERIFIED' })}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Force Verify
                    </Button>
                    <Button
                      variant={u.is_active ? 'destructive' : 'outline'} size="sm"
                      className="w-full h-10 rounded-xl justify-start text-sm"
                      disabled={isLoading}
                      onClick={() => handleAction(u.id, { is_active: !u.is_active })}
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      {u.is_active ? 'Ban User' : 'Unban User'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {filteredUsers.length === 0 && (
          <div className="bg-white rounded-2xl border border-border-light p-10 text-center text-text-muted text-sm">
            No users match your filters.
          </div>
        )}
      </div>
    </div>
  )
}
