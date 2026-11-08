import { PortalShell } from '@/components/layout/portal-shell';
import { PageContainer } from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProviderServicesLoading() {
  return (
    <PortalShell
      area="provider"
      breadcrumbs={[{ label: 'My Services', href: '/provider/services' }]}
    >
      <PageContainer maxWidth="7xl">
        <div className="space-y-8 animate-pulse">
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32 rounded-full" />
              <Skeleton className="h-8 w-64 rounded-xl" />
              <Skeleton className="h-4 w-96 max-w-full rounded-lg" />
            </div>
            <Skeleton className="h-9 w-36 rounded-xl" />
          </div>

          {/* Metrics Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border/60 bg-card/60 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20 rounded" />
                  <Skeleton className="h-7 w-7 rounded-lg" />
                </div>
                <Skeleton className="h-7 w-12 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
            ))}
          </div>

          {/* Filter Bar Skeleton */}
          <div className="h-14 rounded-2xl border border-border/60 bg-card/60" />

          {/* Cards Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-border/60 bg-card/60 space-y-4 pb-4"
              >
                <Skeleton className="h-44 w-full" />
                <div className="px-4 space-y-2">
                  <Skeleton className="h-5 w-3/4 rounded" />
                  <Skeleton className="h-3 w-full rounded" />
                  <Skeleton className="h-3 w-2/3 rounded" />
                </div>
                <div className="mx-4 h-14 rounded-xl bg-muted/40" />
                <div className="flex justify-between px-4 pt-2">
                  <Skeleton className="h-4 w-16 rounded" />
                  <Skeleton className="h-7 w-20 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageContainer>
    </PortalShell>
  );
}

