import { PortalShell } from '@/components/layout/portal-shell';
import { PageContainer } from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export default function StudentBookingsLoading() {
  return (
    <PortalShell
      area="student"
      breadcrumbs={[{ label: 'My Bookings', href: '/student/bookings' }]}
    >
      <PageContainer maxWidth="7xl">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
            <div className="space-y-2">
              <Skeleton className="h-8 w-60 rounded-xl" />
              <Skeleton className="h-4 w-96 max-w-full rounded-lg" />
            </div>
            <Skeleton className="h-9 w-36 rounded-xl" />
          </div>

          {/* KPI Stat Cards Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4 space-y-2.5 bg-card/50 border-border/60">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-16 rounded" />
                  <Skeleton className="h-4 w-4 rounded-md" />
                </div>
                <Skeleton className="h-7 w-12 rounded-lg" />
              </Card>
            ))}
          </div>

          {/* Tabs Navigation Skeleton */}
          <div className="h-10 w-full max-w-md rounded-xl bg-muted/50 p-1 flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-full flex-1 rounded-lg" />
            ))}
          </div>

          {/* Search & Filter Toolbar Skeleton */}
          <Card className="p-3 bg-card/50 border-border/60">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              <Skeleton className="h-9 w-full max-w-sm rounded-xl" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-9 w-32 rounded-xl" />
                <Skeleton className="h-9 w-32 rounded-xl" />
                <Skeleton className="h-9 w-32 rounded-xl" />
              </div>
            </div>
          </Card>

          {/* Bookings Table / Cards Skeleton */}
          <Card className="p-4 space-y-3 bg-card/50 border-border/60">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <Skeleton className="h-4 w-40 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
            <div className="space-y-3 pt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3.5 rounded-xl border border-border/40 bg-muted/20"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-44 rounded" />
                      <Skeleton className="h-3 w-32 rounded" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-8 w-24 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </PageContainer>
    </PortalShell>
  );
}

