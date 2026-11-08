import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export default function AdminServicesLoading() {
  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-72 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      {/* Metrics Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-4 space-y-2 bg-card/50">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-16 rounded-full" />
              <Skeleton className="h-4 w-4 rounded-md" />
            </div>
            <Skeleton className="h-8 w-12 rounded-lg" />
            <Skeleton className="h-2.5 w-20 rounded-full" />
          </Card>
        ))}
      </div>

      {/* Search & Filter Skeleton */}
      <Card className="p-4 space-y-4 bg-card/50">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-9 w-72 rounded-xl" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-border/40">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-24 rounded-lg" />
          ))}
        </div>
      </Card>

      {/* Table Skeleton */}
      <Card className="p-4 space-y-3 bg-card/50">
        <Skeleton className="h-6 w-48 rounded-lg" />
        <div className="space-y-2 pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </Card>
    </div>
  );
}

