'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Ban, Check, Eye, ExternalLink, Clock } from 'lucide-react'

const STATUS_STYLES: Record<string, string> = {
  OPEN:       'bg-danger/10 text-danger',
  REVIEWING:  'bg-amber-100 text-amber-700',
  RESOLVED:   'bg-success/10 text-success',
  DISMISSED:  'bg-muted-bg text-text-muted',
}

const REASON_LABELS: Record<string, string> = {
  FAKE_LISTING:   'Fake Listing',
  SCAM:           'Scam / Fraud',
  HARASSMENT:     'Harassment',
  SPAM:           'Spam',
  DISCRIMINATION: 'Discrimination',
  OTHER:          'Other',
}

export function ReportsClient({ initialReports }: { initialReports: any[] }) {
  const [reports, setReports] = useState(initialReports)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED'>('OPEN')
  const supabase = createClient()

  const updateStatus = async (reportId: string, status: 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED') => {
    setLoadingId(reportId)
    const { error } = await supabase.from('reports').update({ status }).eq('id', reportId)
    if (error) {
      toast.error('Failed to update report')
    } else {
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r))
      toast.success(`Report marked as ${status}`)
    }
    setLoadingId(null)
  }

  const handleSuspend = async (userId: string, reportId: string) => {
    if (!confirm('Suspend this user? They will no longer be able to log in.')) return
    setLoadingId(reportId)
    const { error } = await supabase.from('profiles').update({ is_active: false }).eq('id', userId)
    if (error) {
      toast.error('Failed to suspend user')
    } else {
      toast.success('User suspended')
      await updateStatus(reportId, 'RESOLVED')
    }
    setLoadingId(null)
  }

  const handleRemoveListing = async (listingId: string, reportId: string) => {
    if (!confirm('Remove this listing? It will be hidden from all users.')) return
    setLoadingId(reportId)
    const res = await fetch(`/api/admin/remove-listing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: listingId, reason: 'Removed due to user report' }),
    })
    if (!res.ok) {
      toast.error('Failed to remove listing')
    } else {
      toast.success('Listing removed')
      await updateStatus(reportId, 'RESOLVED')
    }
    setLoadingId(null)
  }

  const filtered = filter === 'ALL' ? reports : reports.filter(r => r.status === filter)

  const counts = {
    ALL:       reports.length,
    OPEN:      reports.filter(r => r.status === 'OPEN').length,
    REVIEWING: reports.filter(r => r.status === 'REVIEWING').length,
    RESOLVED:  reports.filter(r => r.status === 'RESOLVED').length,
    DISMISSED: reports.filter(r => r.status === 'DISMISSED').length,
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED', 'ALL'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all ${
              filter === f
                ? 'bg-navy text-white'
                : 'bg-white border border-border-light text-text-muted hover:border-navy/30'
            }`}
          >
            {f} <span className="ml-1 opacity-70">({counts[f]})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-border-light text-text-muted">
          No {filter === 'ALL' ? '' : filter.toLowerCase() + ' '}reports found.
        </div>
      )}

      {filtered.length > 0 && (
        <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-muted-bg/50 border-b border-border-light">
                  <th className="p-4 font-bold text-navy text-sm w-32">Status</th>
                  <th className="p-4 font-bold text-navy text-sm">Reporter</th>
                  <th className="p-4 font-bold text-navy text-sm">Reported</th>
                  <th className="p-4 font-bold text-navy text-sm w-56">Reason</th>
                  <th className="p-4 font-bold text-navy text-sm text-sm">Date</th>
                  <th className="p-4 font-bold text-navy text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {filtered.map(r => (
                  <tr key={r.id} className={`hover:bg-muted-bg/30 ${r.status !== 'OPEN' && r.status !== 'REVIEWING' ? 'opacity-60' : ''}`}>
                    {/* Status */}
                    <td className="p-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[r.status] ?? 'bg-muted-bg text-text-muted'}`}>
                        {r.status}
                      </span>
                    </td>

                    {/* Reporter */}
                    <td className="p-4">
                      <div className="font-medium text-sm text-text-primary">{r.reporter?.name ?? '—'}</div>
                      <div className="text-xs text-text-muted">{r.reporter?.email}</div>
                    </td>

                    {/* Reported entity */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${
                          r.target_type === 'LISTING' ? 'bg-navy/10 text-navy' : 'bg-coral/10 text-coral'
                        }`}>
                          {r.target_type}
                        </span>
                        {r.target_type === 'LISTING' && (
                          <a
                            href={`/listings/${r.target_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-0.5 text-sm font-medium text-navy hover:text-coral underline underline-offset-2 transition-colors"
                          >
                            {r.target_label}
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        )}
                        {r.target_type === 'USER' && (
                          <div>
                            <div className="text-sm font-medium text-text-primary">{r.target_label}</div>
                            {r.target_email && <div className="text-xs text-text-muted">{r.target_email}</div>}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Reason + description */}
                    <td className="p-4">
                      <div className="text-sm font-bold text-text-primary">{REASON_LABELS[r.reason] ?? r.reason}</div>
                      {r.description && (
                        <div className="text-xs text-text-muted mt-1 line-clamp-2">{r.description}</div>
                      )}
                    </td>

                    {/* Date */}
                    <td className="p-4 text-xs text-text-muted whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>

                    {/* Actions */}
                    <td className="p-4">
                      <div className="flex gap-1.5 justify-end flex-wrap">
                        {(r.status === 'OPEN' || r.status === 'REVIEWING') && (
                          <>
                            {/* Mark reviewing */}
                            {r.status === 'OPEN' && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={loadingId === r.id}
                                onClick={() => updateStatus(r.id, 'REVIEWING')}
                                className="text-amber-600 border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                              >
                                <Clock className="w-3.5 h-3.5 mr-1" /> Review
                              </Button>
                            )}

                            {/* Listing-specific: Remove listing */}
                            {r.target_type === 'LISTING' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={loadingId === r.id}
                                onClick={() => handleRemoveListing(r.target_id, r.id)}
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" /> Remove
                              </Button>
                            )}

                            {/* User-specific: Suspend */}
                            {r.target_type === 'USER' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={loadingId === r.id}
                                onClick={() => handleSuspend(r.target_id, r.id)}
                              >
                                <Ban className="w-3.5 h-3.5 mr-1" /> Suspend
                              </Button>
                            )}

                            {/* Resolve */}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={loadingId === r.id}
                              onClick={() => updateStatus(r.id, 'RESOLVED')}
                              className="border-success text-success hover:bg-success/5 hover:text-success"
                            >
                              <Check className="w-3.5 h-3.5 mr-1" /> Resolve
                            </Button>

                            {/* Dismiss */}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={loadingId === r.id}
                              onClick={() => updateStatus(r.id, 'DISMISSED')}
                            >
                              Dismiss
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
