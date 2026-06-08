import { Skeleton } from '@/components/ui/skeleton'

export default function AdminLoading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-36 mb-2" />
          <Skeleton className="h-3 w-44" />
        </div>
        <Skeleton className="h-7 w-16 rounded-2xl" />
      </div>

      {/* Primary KPI skeletons — 2 col mobile, 5 col desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
            <Skeleton className="h-9 w-9 rounded-xl mb-2.5" />
            <Skeleton className="h-7 w-14 mb-1.5" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Secondary KPI skeletons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
            <Skeleton className="h-9 w-9 rounded-xl mb-2.5" />
            <Skeleton className="h-7 w-14 mb-1.5" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <Skeleton className="h-4 w-44 mb-4" />
          <Skeleton className="h-[220px] w-full rounded-xl" />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <Skeleton className="h-4 w-28 mb-4" />
          <Skeleton className="h-[220px] w-full rounded-full" />
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <Skeleton className="h-4 w-40 mb-4" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <Skeleton className="h-4 w-44 mb-4" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>
      </div>

      {/* Recent registrations */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <Skeleton className="h-4 w-40 mb-1" />
        <Skeleton className="h-3 w-48 mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-50">
            <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-3.5 w-28 mb-1.5" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-5 w-12 rounded-full ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
