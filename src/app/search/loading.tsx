import { Skeleton } from '@/components/ui/skeleton'

export default function SearchLoading() {
  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-muted-bg">
      <div className="hidden lg:block w-[55vw] bg-border-light animate-pulse" />
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex flex-wrap gap-3 mb-6">
          <Skeleton className="h-9 w-[130px]" />
          <Skeleton className="h-9 w-[120px]" />
          <Skeleton className="h-9 w-[80px]" />
          <Skeleton className="h-9 w-[80px]" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border-light overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex justify-between pt-3 border-t border-border-light">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
