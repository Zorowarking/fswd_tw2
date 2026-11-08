import { PortalShell } from '@/components/layout/portal-shell';
import { PageContainer } from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboardLoading() {
  return (
    <PortalShell
      area="admin"
      breadcrumbs={[{ label: 'Central Administration', active: true }]}
    >
      <PageContainer
        title="Admin Command Dashboard"
        description="Comprehensive university-wide analytics, booking operations, revenue reconciliation, and RBAC user directory."
      >
        <div className="space-y-8 animate-pulse">
          {/* Top Banner Skeleton */}
          <Skeleton className="h-32 w-full rounded-3xl" />

          {/* 10 Stats Cards Skeletons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>

          {/* Charts Skeletons */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-72 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
          </div>

          {/* Table Skeletons */}
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </PageContainer>
    </PortalShell>
  );
}
