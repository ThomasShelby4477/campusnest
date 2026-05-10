import { Skeleton } from '@/components/ui/skeleton'

export default function NotificationsLoading() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-muted-bg pb-12">
      <div className="max-w-3xl mx-auto pt-8 px-4">
        <Skeleton className="h-9 w-48 mb-6" />
        <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-6 flex gap-4 border-b border-border-light last:border-b-0">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
