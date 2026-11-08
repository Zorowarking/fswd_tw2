import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export default function AdminAnalyticsLoading() {
  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-80 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-48 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5 space-y-3 bg-card/50">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-28 rounded-full" />
              <Skeleton className="h-6 w-6 rounded-lg" />
            </div>
            <Skeleton className="h-9 w-32 rounded-lg" />
            <div className="flex items-center justify-between pt-1">
              <Skeleton className="h-3 w-24 rounded-full" />
              <Skeleton className="h-3 w-16 rounded-full" />
            </div>
          </Card>
        ))}
      </div>

      {/* Main Area Chart Skeleton */}
      <Card className="p-6 space-y-4 bg-card/50">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-6 w-52 rounded-lg" />
            <Skeleton className="h-3.5 w-72 rounded-full" />
          </div>
          <Skeleton className="h-8 w-36 rounded-xl" />
        </div>
        <div className="grid grid-cols-3 gap-3 pt-2">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl pt-4" />
      </Card>

      {/* Distributions Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4 bg-card/50">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <div className="flex items-center gap-6 py-4">
            <Skeleton className="h-36 w-36 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-full rounded-lg" />
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4 bg-card/50">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <div className="flex items-center gap-6 py-4">
            <Skeleton className="h-36 w-36 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-full rounded-lg" />
            </div>
          </div>
        </Card>
      </div>

      {/* Leaderboard Skeleton */}
      <Card className="p-6 space-y-4 bg-card/50">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-56 rounded-lg" />
          <Skeleton className="h-8 w-48 rounded-xl" />
        </div>
        <div className="space-y-3 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      </Card>
    </div>
  );
}

