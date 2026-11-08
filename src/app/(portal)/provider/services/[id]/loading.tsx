import { PortalShell } from '@/components/layout/portal-shell';
import { PageContainer } from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';

export default function ServiceDetailLoading() {
  return (
    <PortalShell
      area="provider"
      breadcrumbs={[
        { label: 'My Services', href: '/provider/services' },
        { label: 'Loading Service...', href: '#' },
      ]}
    >
      <PageContainer maxWidth="7xl">
        <div className="space-y-8 animate-pulse">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-8 w-64 rounded-xl" />
              <Skeleton className="h-4 w-80 rounded" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          </div>

          {/* Banner */}
          <Skeleton className="h-72 w-full rounded-3xl" />

          {/* 4 Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-44 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 rounded-2xl" />
              <Skeleton className="h-44 rounded-2xl" />
            </div>
          </div>
        </div>
      </PageContainer>
    </PortalShell>
  );
}
