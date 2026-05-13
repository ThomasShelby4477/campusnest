'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { UserCircle2, Check, X, Clock, MessageSquare, Building, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/empty-state'
import { toast } from 'sonner'

export default function InterestRequestsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchRequests = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login?redirect=/interest-requests')
      return
    }

    const { data, error } = await supabase
      .from('interest_requests')
      .select(`
        *,
        listings ( id, title, rent, address, listing_images ( url, is_primary ) ),
        requester:profiles!interest_requests_requester_id_fkey (
          id, name, avatar_url, email, year, branch, gender,
          verified_status, verification_badge, student_id_path
        )
      `)
      .eq('poster_id', user.id)
      .order('created_at', { ascending: false })

    if (error) console.error('fetch interest requests error:', error)
    if (data) setRequests(data)
    setLoading(false)
  }

  const handleAction = async (requestId: string, action: 'accept' | 'decline') => {
    setProcessingId(requestId)
    try {
      const res = await fetch(`/api/interest-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Update local state
      setRequests(prev => prev.map(r =>
        r.id === requestId ? { ...r, status: action === 'accept' ? 'ACCEPTED' : 'DECLINED' } : r
      ))

      if (action === 'accept') {
        toast.success('Interest accepted! A chat has been opened.')
        if (data.matchId) {
          router.push(`/chat/${data.matchId}`)
        }
      } else {
        toast.info('Interest declined.')
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to process request')
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted-bg">
        <span className="w-8 h-8 border-4 border-coral/30 border-t-coral rounded-full animate-spin" />
      </div>
    )
  }

  const pending = requests.filter(r => r.status === 'PENDING')
  const processed = requests.filter(r => r.status !== 'PENDING')

  return (
    <div className="min-h-screen bg-muted-bg py-6 sm:py-8 px-4 sm:px-6 lg:px-8 pb-20 sm:pb-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6 sticky top-16 z-30 bg-muted-bg/95 backdrop-blur-sm py-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="w-12 h-12 rounded-xl bg-coral/10 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-coral" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Interest Requests</h1>
            <p className="text-text-muted mt-1">
              {pending.length} pending · {processed.length} processed
            </p>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon="notifications"
              title="No interest requests yet"
              description="When someone shows interest in your listings, you'll see their requests here."
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pending first */}
            {pending.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider px-1">
                  Pending ({pending.length})
                </h2>
                {pending.map(r => (
                  <RequestCard
                    key={r.id}
                    request={r}
                    onAction={handleAction}
                    processingId={processingId}
                    expanded={expandedId === r.id}
                    onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  />
                ))}
              </div>
            )}

            {/* Processed */}
            {processed.length > 0 && (
              <div className="space-y-3 mt-8">
                <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider px-1">
                  Past Requests ({processed.length})
                </h2>
                {processed.map(r => (
                  <RequestCard
                    key={r.id}
                    request={r}
                    onAction={handleAction}
                    processingId={processingId}
                    expanded={expandedId === r.id}
                    onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RequestCard({ request, onAction, processingId, expanded, onToggle }: {
  request: any
  onAction: (id: string, action: 'accept' | 'decline') => void
  processingId: string | null
  expanded: boolean
  onToggle: () => void
}) {
  const requester = request.requester
  const listing = request.listings
  const isProcessing = processingId === request.id
  const isPending = request.status === 'PENDING'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const primaryImage = listing?.listing_images?.find((img: any) => img.is_primary)?.url
    || listing?.listing_images?.[0]?.url
    || '/placeholder-listing.png'

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-colors ${
      isPending ? 'border-coral/30' : 'border-border-light'
    }`}>
      {/* Header — always visible */}
      <div className="p-4 sm:p-5 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start gap-3">
          {/* Requester avatar */}
          <div className="w-12 h-12 rounded-full overflow-hidden bg-muted-bg shrink-0 relative border border-border-light">
            {requester?.avatar_url ? (
              <Image src={requester.avatar_url} alt={requester.name || ''} fill className="object-cover" />
            ) : (
              <UserCircle2 className="w-full h-full text-text-muted p-1" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-text-primary">{requester?.name || 'User'}</h3>
              {requester?.verification_badge && <ShieldCheck className="w-4 h-4 text-success" />}
              {isPending && (
                <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3" /> Pending
                </span>
              )}
              {request.status === 'ACCEPTED' && (
                <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                  <Check className="w-3 h-3" /> Accepted
                </span>
              )}
              {request.status === 'DECLINED' && (
                <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-text-muted bg-muted-bg px-2 py-0.5 rounded-full">
                  <X className="w-3 h-3" /> Declined
                </span>
              )}
            </div>

            <p className="text-sm text-text-muted mt-0.5">
              Interested in: <span className="font-medium text-text-primary">{listing?.title || 'Unknown listing'}</span>
            </p>
            <p className="text-xs text-text-muted mt-1">
              {new Date(request.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              {' · '}
              {new Date(request.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <button className="text-text-muted p-1 shrink-0">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border-light">
          {/* Message */}
          {request.message && (
            <div className="px-5 py-3 bg-muted-bg/50">
              <p className="text-sm font-medium text-text-primary mb-1">Message:</p>
              <p className="text-sm text-text-muted italic">"{request.message}"</p>
            </div>
          )}

          {/* Requester details */}
          <div className="px-5 py-4 space-y-3">
            <h4 className="text-sm font-bold text-text-primary">Requester Profile</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-text-muted">Name:</span>
                <span className="ml-1 font-medium">{requester?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-text-muted">Gender:</span>
                <span className="ml-1 font-medium">{requester?.gender || 'N/A'}</span>
              </div>
              {requester?.year && (
                <div>
                  <span className="text-text-muted">Year:</span>
                  <span className="ml-1 font-medium">{requester.year}</span>
                </div>
              )}
              {requester?.branch && (
                <div>
                  <span className="text-text-muted">Branch:</span>
                  <span className="ml-1 font-medium">{requester.branch}</span>
                </div>
              )}
              <div>
                <span className="text-text-muted">Verified:</span>
                <span className={`ml-1 font-medium ${
                  requester?.verified_status === 'VERIFIED' ? 'text-success' : 'text-amber-600'
                }`}>
                  {requester?.verified_status || 'Unknown'}
                </span>
              </div>
            </div>

            {/* Student ID if available */}
            {requester?.student_id_path && (
              <div className="mt-2">
                <p className="text-xs text-text-muted mb-1.5">Student ID uploaded ✓</p>
              </div>
            )}
          </div>

          {/* Action buttons for pending */}
          {isPending && (
            <div className="px-5 py-4 border-t border-border-light flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-danger text-danger hover:bg-danger/5"
                onClick={() => onAction(request.id, 'decline')}
                disabled={isProcessing}
              >
                <X className="w-4 h-4 mr-1.5" /> Decline
              </Button>
              <Button
                className="flex-1 bg-success hover:bg-success/90 text-white"
                onClick={() => onAction(request.id, 'accept')}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1.5" /> Accept & Chat
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
