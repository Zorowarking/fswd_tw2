import { PortalShell } from '@/components/layout/portal-shell';
import { PageContainer } from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';

export default function StudentServiceDetailLoading() {
  return (
    <PortalShell
      area="student"
      breadcrumbs={[
        { label: 'Browse Services', href: '/student/services' },
        { label: 'Loading Service Details...', href: '#' },
      ]}
    >
      <PageContainer maxWidth="7xl">
        <div className="space-y-8 animate-pulse">
          {/* Header */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-40 rounded" />
            <Skeleton className="h-8 w-72 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded" />
          </div>

          {/* 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left */}
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-72 w-full rounded-3xl" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-2xl" />
                ))}
              </div>
              <Skeleton className="h-44 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>

            {/* Right Booking Panel */}
            <div className="space-y-6">
              <Skeleton className="h-96 w-full rounded-3xl" />
            </div>
          </div>
        </div>
      </PageContainer>
    </PortalShell>
  );
}

