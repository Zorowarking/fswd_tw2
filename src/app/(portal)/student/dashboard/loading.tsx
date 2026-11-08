import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export default function StudentDashboardLoading() {
  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Welcome Banner Skeleton */}
      <div className="rounded-3xl border border-border/60 bg-card/60 p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40 rounded-full" />
            <Skeleton className="h-9 w-72 sm:w-96 rounded-xl" />
            <Skeleton className="h-4 w-60 rounded-lg" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-28 rounded-xl" />
            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>
        </div>
      </div>

      {/* 5 Metrics Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="p-4 space-y-3 bg-card/50">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-8 rounded-xl" />
              <Skeleton className="h-3 w-16 rounded-full" />
            </div>
            <Skeleton className="h-8 w-12 rounded-lg" />
            <Skeleton className="h-3 w-24 rounded-full" />
          </Card>
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Tabs & Services */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-6 space-y-4 bg-card/50">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-36 rounded-lg" />
              <Skeleton className="h-9 w-64 rounded-xl" />
            </div>
            <Skeleton className="h-48 w-full rounded-2xl" />
          </Card>

          <Card className="p-6 space-y-4 bg-card/50">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-48 rounded-lg" />
              <Skeleton className="h-4 w-28 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-2xl" />
              ))}
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Quick Actions & Activity */}
        <div className="space-y-6">
          <Card className="p-5 space-y-4 bg-card/50">
            <Skeleton className="h-5 w-32 rounded-lg" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          </Card>

          <Card className="p-5 space-y-4 bg-card/50">
            <Skeleton className="h-5 w-36 rounded-lg" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
