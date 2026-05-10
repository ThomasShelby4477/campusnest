'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ExternalLink, Check, X, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export function ListingsClient({ initialListings }: { initialListings: any[] }) {
  const [listings, setListings] = useState(initialListings)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const supabase = createClient()

  const toggleVerify = async (id: string, current: boolean) => {
    setLoadingId(id)
    const { error } = await supabase.from('listings').update({ is_verified: !current }).eq('id', id)
    if (error) {
      toast.error('Failed to verify listing')
    } else {
      setListings(prev => prev.map(l => l.id === id ? { ...l, is_verified: !current } : l))
      toast.success(current ? 'Verification removed' : 'Listing verified')
    }
    setLoadingId(null)
  }

  const toggleActive = async (id: string, current: boolean) => {
    setLoadingId(id)
    const { error } = await supabase.from('listings').update({ is_active: !current }).eq('id', id)
    if (error) {
      toast.error('Failed to update visibility')
    } else {
      setListings(prev => prev.map(l => l.id === id ? { ...l, is_active: !current } : l))
      toast.success(current ? 'Listing deactivated' : 'Listing activated')
    }
    setLoadingId(null)
  }

  if (listings.length === 0) return <div className="text-center p-8 bg-white rounded-2xl border border-border-light text-text-muted">No listings found.</div>

  return (
    <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-muted-bg/50 border-b border-border-light">
              <th className="p-4 font-bold text-navy text-sm">Title & Host</th>
              <th className="p-4 font-bold text-navy text-sm">Rent</th>
              <th className="p-4 font-bold text-navy text-sm">Status</th>
              <th className="p-4 font-bold text-navy text-sm text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {listings.map(l => (
              <tr key={l.id} className="hover:bg-muted-bg/30">
                <td className="p-4">
                  <div className="font-bold text-text-primary mb-1 truncate max-w-xs">{l.title}</div>
                  <div className="text-xs text-text-muted">{l.profiles?.name} ({l.profiles?.email})</div>
                </td>
                <td className="p-4 text-sm font-medium">₹{l.rent_amount}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    {l.is_verified ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-success/10 text-success px-2 py-1 rounded-full font-bold">
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs bg-warning/10 text-warning px-2 py-1 rounded-full font-bold">
                        Unverified
                      </span>
                    )}
                    {l.is_active ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-navy/10 text-navy px-2 py-1 rounded-full font-bold">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs bg-border-light text-text-muted px-2 py-1 rounded-full font-bold">
                        Hidden
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4 flex gap-2 justify-end">
                  <Link href={`/listings/${l.id}`} target="_blank" className="inline-flex items-center justify-center h-7 px-2.5 rounded-lg border border-border bg-background hover:bg-muted text-sm font-medium transition-all">
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  <Button 
                    variant={l.is_verified ? 'outline' : 'default'}
                    className={!l.is_verified ? 'bg-success hover:bg-success/90 text-white' : ''}
                    size="sm"
                    disabled={loadingId === l.id}
                    onClick={() => toggleVerify(l.id, l.is_verified)}
                  >
                    {l.is_verified ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    {l.is_verified ? ' Unverify' : ' Verify'}
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    disabled={loadingId === l.id}
                    onClick={() => toggleActive(l.id, l.is_active)}
                  >
                    {l.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
