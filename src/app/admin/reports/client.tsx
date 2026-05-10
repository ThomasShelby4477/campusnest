'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Ban, ShieldAlert, Check } from 'lucide-react'

export function ReportsClient({ initialReports }: { initialReports: any[] }) {
  const [reports, setReports] = useState(initialReports)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const supabase = createClient()

  const handleAction = async (reportId: string, action: 'RESOLVED' | 'DISMISSED') => {
    setLoadingId(reportId)
    const { error } = await supabase.from('reports').update({ status: action }).eq('id', reportId)
    
    if (error) {
      toast.error('Failed to update report')
    } else {
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: action } : r))
      toast.success(`Report marked as ${action}`)
    }
    setLoadingId(null)
  }

  const handleSuspend = async (userId: string, reportId: string) => {
    setLoadingId(reportId)
    const { error } = await supabase.from('profiles').update({ is_active: false }).eq('id', userId)
    if (error) {
      toast.error('Failed to suspend user')
    } else {
      toast.success('User suspended')
      handleAction(reportId, 'RESOLVED')
    }
    setLoadingId(null)
  }

  if (reports.length === 0) return <div className="text-center p-8 bg-white rounded-2xl border border-border-light text-text-muted">No reports found.</div>

  return (
    <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-muted-bg/50 border-b border-border-light">
              <th className="p-4 font-bold text-navy text-sm w-32">Status</th>
              <th className="p-4 font-bold text-navy text-sm">Reporter</th>
              <th className="p-4 font-bold text-navy text-sm">Reported Entity</th>
              <th className="p-4 font-bold text-navy text-sm w-64">Reason</th>
              <th className="p-4 font-bold text-navy text-sm text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {reports.map(r => (
              <tr key={r.id} className={`hover:bg-muted-bg/30 ${r.status !== 'OPEN' ? 'opacity-60 bg-muted-bg/50' : ''}`}>
                <td className="p-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${r.status === 'OPEN' ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                    {r.status}
                  </span>
                </td>
                <td className="p-4">
                  <div className="font-medium text-sm text-text-primary">{r.reporter?.name}</div>
                </td>
                <td className="p-4">
                  <div className="font-medium text-sm text-text-primary">
                    {r.reported_id ? `User: ${r.reported?.name}` : `Listing: ${r.listing_id}`}
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-sm font-bold text-text-primary">{r.reason}</div>
                  <div className="text-xs text-text-muted mt-1">{r.description}</div>
                </td>
                <td className="p-4 flex gap-2 justify-end">
                  {r.status === 'OPEN' && (
                    <>
                      {r.reported_id && (
                        <Button 
                          variant="destructive"
                          size="sm"
                          disabled={loadingId === r.id}
                          onClick={() => handleSuspend(r.reported_id, r.id)}
                        >
                          <Ban className="w-4 h-4 mr-1" /> Suspend
                        </Button>
                      )}
                      <Button 
                        variant="outline"
                        className="bg-white border-success text-success hover:bg-success/5 hover:text-success"
                        size="sm"
                        disabled={loadingId === r.id}
                        onClick={() => handleAction(r.id, 'RESOLVED')}
                      >
                        <Check className="w-4 h-4 mr-1" /> Resolve
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        disabled={loadingId === r.id}
                        onClick={() => handleAction(r.id, 'DISMISSED')}
                      >
                        Dismiss
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
