import { Skeleton } from '@/components/ui/skeleton'

export default function AdminLoading() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-44 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-8 w-24 rounded-2xl" />
      </div>

      {/* KPI skeletons */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-3xl border border-border-light p-5">
            <Skeleton className="h-10 w-10 rounded-xl mb-3" />
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-3xl border border-border-light p-5">
            <Skeleton className="h-10 w-10 rounded-xl mb-3" />
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Chart skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-border-light p-6">
          <Skeleton className="h-5 w-48 mb-4" />
          <Skeleton className="h-[300px] w-full rounded-2xl" />
        </div>
        <div className="bg-white rounded-3xl border border-border-light p-6">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-[250px] w-full rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-border-light p-6">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-[300px] w-full rounded-2xl" />
        </div>
        <div className="bg-white rounded-3xl border border-border-light p-6">
          <Skeleton className="h-5 w-44 mb-4" />
          <Skeleton className="h-[300px] w-full rounded-2xl" />
        </div>
      </div>

      {/* Recent activity skeleton */}
      <div className="bg-white rounded-3xl border border-border-light p-6">
        <Skeleton className="h-5 w-40 mb-1" />
        <Skeleton className="h-3 w-48 mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-border-light/50">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-5 w-48 hidden sm:block" />
            <Skeleton className="h-5 w-16 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
