'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Building, Pencil, Trash2, Eye, MapPin, AlertCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { EmptyState } from '@/components/empty-state'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function MyListingsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchMyListings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchMyListings = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login?redirect=/my-listings')
      return
    }

    const { data } = await supabase
      .from('listings')
      .select(`
        *,
        listing_images ( url, is_primary )
      `)
      .eq('poster_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (data) setListings(data)
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const { error } = await supabase
        .from('listings')
        .update({ is_active: false })
        .eq('id', deleteId)

      if (error) throw error
      
      setListings(listings.filter(l => l.id !== deleteId))
      toast.success('Listing removed successfully')
    } catch (err) {
      toast.error('Failed to delete listing')
    } finally {
      setDeleteId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted-bg">
        <span className="w-8 h-8 border-4 border-coral/30 border-t-coral rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted-bg pb-16">

      {/* Sticky header */}
      <div className="sticky top-16 z-30 bg-muted-bg/95 backdrop-blur-sm">
        <div className="bg-gradient-to-b from-navy/5 via-navy/[0.02] to-transparent pt-10 pb-6 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-coral/10 flex items-center justify-center">
                  <Building className="w-5 h-5 text-coral" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-navy">My Listings</h1>
                  <p className="text-sm text-text-muted">Manage your properties</p>
                </div>
              </div>
              <Link href="/create-listing">
                <Button className="bg-coral hover:bg-coral-dark text-white font-semibold rounded-2xl shadow-md shadow-coral/20 transition-all hover:shadow-lg hover:shadow-coral/25 active:scale-[0.98]">
                  + Post New Listing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {listings.length === 0 ? (
          <div className="bg-white rounded-3xl border border-border-light shadow-lg shadow-navy/[0.03] p-12">
            <EmptyState
              icon="listings"
              title="You have no active listings"
              description="Got a spare room or a PG bed? List it here to find verified NFSU students."
              actionLabel="Create Listing"
              actionHref="/create-listing"
            />
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map(listing => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const primaryImage = listing.listing_images?.find((img: any) => img.is_primary)?.url 
                || listing.listing_images?.[0]?.url 
                || '/placeholder-listing.png'

              return (
                <div key={listing.id} className="group bg-white rounded-3xl border border-border-light shadow-sm hover:shadow-lg hover:shadow-navy/[0.05] transition-all duration-300 overflow-hidden flex flex-col sm:flex-row">
                  
                  {/* Image */}
                  <div className="relative w-full sm:w-56 h-48 sm:h-auto shrink-0 bg-muted-bg overflow-hidden">
                    <Image src={primaryImage} alt={listing.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    {listing.is_verified && (
                      <div className="absolute top-3 left-3 px-2.5 py-1 bg-success text-white text-[10px] font-bold rounded-full flex items-center gap-1 shadow-md">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                        Verified
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 p-5 flex flex-col">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                      <h3 className="text-lg font-bold text-navy truncate pr-2" title={listing.title}>
                        {listing.title}
                      </h3>
                      <div className="shrink-0">
                        {listing.is_verified ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-success/10 text-success text-xs font-semibold rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-success" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-warning/10 text-warning text-xs font-semibold rounded-full">
                            <Clock className="w-3 h-3" /> Pending Review
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-2xl font-black text-navy">₹{listing.rent.toLocaleString('en-IN')}</span>
                      <span className="text-sm text-text-muted font-medium">/month</span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-text-muted mb-4">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-coral" />
                        {listing.address.length > 35 ? listing.address.substring(0, 35) + '...' : listing.address}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-text-muted" /> {listing.views} views
                      </span>
                      <span className="px-2 py-0.5 bg-muted-bg rounded-full text-xs font-medium">{listing.room_type}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-auto">
                      <Link href={`/listings/${listing.id}`}>
                        <Button variant="outline" size="sm" className="h-9 rounded-xl font-medium">
                          <Eye className="w-3.5 h-3.5 mr-1.5" /> View
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" className="h-9 rounded-xl font-medium border-navy/20 text-navy hover:bg-navy/5">
                        <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-9 rounded-xl font-medium text-danger hover:text-danger hover:bg-danger/10 sm:ml-auto"
                        onClick={() => setDeleteId(listing.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                      </Button>
                    </div>
                  </div>

                </div>
              )
            })}
          </div>
        )}

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-danger" /> Delete Listing?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this listing? It will be permanently removed from search results.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-danger hover:bg-danger/90 text-white">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </div>
  )
}
