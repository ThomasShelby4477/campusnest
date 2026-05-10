'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ExternalLink, CheckCircle, XCircle } from 'lucide-react'

export function VerificationsClient({ initialProfiles }: { initialProfiles: any[] }) {
  const [profiles, setProfiles] = useState(initialProfiles)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const supabase = createClient()

  const viewIdCard = async (path: string) => {
    try {
      const res = await fetch(`/api/admin/signed-url?path=${encodeURIComponent(path)}`)
      const data = await res.json()
      if (data.signedUrl) {
        window.open(data.signedUrl, '_blank')
      } else {
        toast.error('Failed to get URL')
      }
    } catch (err) {
      toast.error('Error fetching ID card')
    }
  }

  const handleAction = async (userId: string, action: 'VERIFIED' | 'REJECTED') => {
    setLoadingId(userId)
    
    try {
      const res = await fetch('/api/admin/verify-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      })
      
      const data = await res.json()
      
      if (!res.ok || data.error) {
        toast.error(data.error || 'Failed to update status')
      } else {
        setProfiles(prev => prev.filter(p => p.id !== userId))
        toast.success(`User ${action.toLowerCase()}`)
      }
    } catch (err) {
      toast.error('Network error occurred')
    } finally {
      setLoadingId(null)
    }
  }

  if (profiles.length === 0) {
    return <div className="text-text-muted bg-white p-8 rounded-2xl border border-border-light text-center">No pending verifications.</div>
  }

  return (
    <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted-bg/50 border-b border-border-light">
              <th className="p-4 font-bold text-navy text-sm">User</th>
              <th className="p-4 font-bold text-navy text-sm">Year/Branch</th>
              <th className="p-4 font-bold text-navy text-sm">ID Card</th>
              <th className="p-4 font-bold text-navy text-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {profiles.map(p => (
              <tr key={p.id} className="hover:bg-muted-bg/30">
                <td className="p-4">
                  <div className="font-bold text-text-primary">{p.name}</div>
                  <div className="text-sm text-text-muted">{p.email}</div>
                </td>
                <td className="p-4 text-sm text-text-primary">{p.year} - {p.branch}</td>
                <td className="p-4">
                  {p.id_card_url ? (
                    <Button variant="outline" size="sm" onClick={() => viewIdCard(p.id_card_url)} className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" /> View
                    </Button>
                  ) : (
                    <span className="text-text-muted text-sm italic">Missing</span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="bg-success hover:bg-success/90 text-white"
                      disabled={loadingId === p.id}
                      onClick={() => handleAction(p.id, 'VERIFIED')}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      disabled={loadingId === p.id}
                      onClick={() => handleAction(p.id, 'REJECTED')}
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Reject
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
