import { PortalShell } from '@/components/layout/portal-shell';
import { PageContainer } from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProviderAvailabilityLoading() {
  return (
    <PortalShell
      area="provider"
      breadcrumbs={[
        { label: 'My Services', href: '/provider/services' },
        { label: 'Availability & Calendar', href: '/provider/availability' },
      ]}
    >
      <PageContainer maxWidth="7xl">
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-40 rounded-xl" />
              <Skeleton className="h-9 w-36 rounded-xl" />
            </div>
          </div>

          {/* Metric cards skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>

          {/* Tabs skeleton */}
          <Skeleton className="h-10 w-96 rounded-xl" />

          {/* Calendar grid skeleton */}
          <Skeleton className="h-[480px] w-full rounded-2xl" />
        </div>
      </PageContainer>
    </PortalShell>
  );
}

