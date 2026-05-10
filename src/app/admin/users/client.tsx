'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Shield, Ban, CheckCircle, Search } from 'lucide-react'

export function UsersClient({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [loadingId, setLoadingId] = useState<string | null>(null)
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input 
            placeholder="Search users..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v ?? 'ALL')}>
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Filter by Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Roles</SelectItem>
            <SelectItem value="USER">User</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
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
                  <td className="p-4 flex gap-2 justify-end">
                    <Button 
                      variant="outline"
                      size="sm"
                      disabled={loadingId === u.id}
                      onClick={() => handleAction(u.id, { role: u.role === 'ADMIN' ? 'USER' : 'ADMIN' })}
                    >
                      <Shield className="w-4 h-4 mr-1" /> {u.role === 'ADMIN' ? 'Revoke Admin' : 'Make Admin'}
                    </Button>
                    <Button 
                      variant="outline"
                      className="bg-white border-success text-success hover:bg-success/5 hover:text-success"
                      size="sm"
                      disabled={loadingId === u.id || u.verified_status === 'VERIFIED'}
                      onClick={() => handleAction(u.id, { verified_status: 'VERIFIED' })}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> Force Verify
                    </Button>
                    <Button 
                      variant={u.is_active ? 'destructive' : 'outline'}
                      size="sm"
                      disabled={loadingId === u.id}
                      onClick={() => handleAction(u.id, { is_active: !u.is_active })}
                    >
                      <Ban className="w-4 h-4 mr-1" /> {u.is_active ? 'Ban' : 'Unban'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
