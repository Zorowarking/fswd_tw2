import { PortalShell } from '@/components/layout/portal-shell';
import { PageContainer } from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';

export default function StudentServicesLoading() {
  return (
    <PortalShell
      area="student"
      breadcrumbs={[{ label: 'Browse Services', href: '/student/services' }]}
    >
      <PageContainer maxWidth="7xl">
        <div className="space-y-8 animate-pulse">
          {/* Hero Banner Skeleton */}
          <div className="h-44 w-full rounded-3xl border border-border/60 bg-card/60 p-6 space-y-3">
            <Skeleton className="h-5 w-40 rounded-full" />
            <Skeleton className="h-8 w-72 rounded-xl" />
            <Skeleton className="h-4 w-96 max-w-full rounded-lg" />
          </div>

          {/* Categories Horizontal Pills Skeleton */}
          <div className="flex gap-2 overflow-x-hidden">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-28 shrink-0 rounded-xl" />
            ))}
          </div>

          {/* Search and Filters Bar Skeleton */}
          <div className="h-14 rounded-2xl border border-border/60 bg-card/60" />

          {/* Results count skeleton */}
          <Skeleton className="h-4 w-48 rounded" />

          {/* Grid of 6 Service Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-border/60 bg-card/60 space-y-4 pb-4"
              >
                <Skeleton className="h-48 w-full" />
                <div className="px-4 space-y-2">
                  <Skeleton className="h-5 w-3/4 rounded" />
                  <Skeleton className="h-3 w-full rounded" />
                  <Skeleton className="h-3 w-2/3 rounded" />
                </div>
                <div className="mx-4 h-12 rounded-xl bg-muted/40" />
                <div className="flex justify-between items-center px-4 pt-2">
                  <Skeleton className="h-5 w-16 rounded" />
                  <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageContainer>
    </PortalShell>
  );
}

