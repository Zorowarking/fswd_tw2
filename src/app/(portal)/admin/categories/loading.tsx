import { PortalShell } from '@/components/layout/portal-shell';
import { PageContainer } from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminCategoriesLoading() {
  return (
    <PortalShell
      area="admin"
      breadcrumbs={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Categories', href: '/admin/categories' },
      ]}
    >
      <PageContainer maxWidth="7xl">
        <div className="space-y-8 pb-12">
          {/* Header Banner Skeleton */}
          <div className="rounded-3xl border border-border/70 p-6 sm:p-8 space-y-3">
            <Skeleton className="h-6 w-36 rounded-full" />
            <Skeleton className="h-9 w-64 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-lg" />
          </div>

          {/* Metric Cards Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/70 p-4 space-y-2">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-8 w-16 rounded" />
              </div>
            ))}
          </div>

          {/* Search Toolbar Skeleton */}
          <div className="rounded-2xl border border-border/70 p-4 flex gap-4">
            <Skeleton className="h-10 flex-1 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>

          {/* Category Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-3xl border border-border/70 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-12 w-12 rounded-2xl" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="h-6 w-40 rounded" />
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </PageContainer>
    </PortalShell>
  );
}
