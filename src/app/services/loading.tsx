import { PageContainer } from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export default function PublicServicesLoading() {
  return (
    <div className="py-8 sm:py-12">
      <PageContainer maxWidth="7xl">
        <div className="space-y-8 animate-pulse">
          {/* Hero Banner Skeleton */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Skeleton className="h-6 w-36 mx-auto rounded-full" />
            <Skeleton className="h-9 w-80 mx-auto rounded-xl" />
            <Skeleton className="h-4 w-96 max-w-full mx-auto rounded-lg" />
          </div>

          {/* Search bar & Category filters */}
          <div className="max-w-xl mx-auto space-y-3">
            <Skeleton className="h-12 w-full rounded-2xl" />
            <div className="flex justify-center gap-2 overflow-x-hidden pt-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-24 rounded-full shrink-0" />
              ))}
            </div>
          </div>

          {/* Grid of 6 services */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden border-border/60 bg-card/60 space-y-4 pb-4">
                <Skeleton className="h-48 w-full" />
                <div className="px-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-4 w-16 rounded" />
                  </div>
                  <Skeleton className="h-6 w-3/4 rounded" />
                  <Skeleton className="h-3 w-full rounded" />
                  <Skeleton className="h-3 w-2/3 rounded" />
                </div>
                <div className="mx-4 h-11 rounded-xl bg-muted/40" />
                <div className="flex justify-between items-center px-4 pt-2 border-t border-border/40">
                  <Skeleton className="h-5 w-20 rounded" />
                  <Skeleton className="h-8 w-28 rounded-lg" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </PageContainer>
    </div>
  );
}

