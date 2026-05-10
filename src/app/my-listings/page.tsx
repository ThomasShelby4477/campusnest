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
    <div className="min-h-screen bg-muted-bg py-6 sm:py-8 px-4 sm:px-6 lg:px-8 pb-20 sm:pb-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-navy/10 flex items-center justify-center">
              <Building className="w-6 h-6 text-navy" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">My Listings</h1>
              <p className="text-text-muted mt-1">Manage your properties</p>
            </div>
          </div>
          <Link href="/create-listing">
            <Button className="bg-coral hover:bg-coral-dark text-white">
              + Post New Listing
            </Button>
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon="listings"
              title="You have no active listings"
              description="Got a spare room or a PG bed? List it here to find verified NFSU students."
              actionLabel="Create Listing"
              actionHref="/create-listing"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map(listing => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const primaryImage = listing.listing_images?.find((img: any) => img.is_primary)?.url 
                || listing.listing_images?.[0]?.url 
                || '/placeholder-listing.png'

              return (
                <div key={listing.id} className="bg-white border border-border-light rounded-xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row gap-6 items-start">
                  
                  <div className="relative w-full sm:w-48 h-48 sm:h-32 rounded-lg overflow-hidden shrink-0 bg-muted-bg">
                    <Image src={primaryImage} alt={listing.title} fill className="object-cover" />
                  </div>
                  
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                      <h3 className="text-xl font-bold text-text-primary truncate" title={listing.title}>
                        {listing.title}
                      </h3>
                      <div className="flex items-center gap-2 shrink-0 text-sm font-semibold">
                        {listing.is_verified ? (
                          <span className="px-2.5 py-1 bg-success/10 text-success rounded-md flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-success"></span> Verified
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-warning/10 text-warning-dark rounded-md flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Pending Review
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-2xl font-bold text-navy mb-3">₹{listing.rent}</p>
                    
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-text-muted mb-4">
                      <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4"/> {listing.address.substring(0, 30)}...</span>
                      <span className="flex items-center gap-1.5"><Eye className="w-4 h-4"/> {listing.views} views</span>
                      <span className="px-2 py-0.5 bg-muted-bg rounded">{listing.room_type}</span>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link href={`/listings/${listing.id}`}>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto h-9">
                          <Eye className="w-4 h-4 mr-2" /> View Public
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" className="w-full sm:w-auto h-9 border-navy text-navy hover:bg-navy/5">
                        <Pencil className="w-4 h-4 mr-2" /> Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full sm:w-auto h-9 text-danger hover:text-danger hover:bg-danger/10 sm:ml-auto"
                        onClick={() => setDeleteId(listing.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
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
