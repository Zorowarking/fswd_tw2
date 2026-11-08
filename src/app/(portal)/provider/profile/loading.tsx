import { PortalShell } from '@/components/layout/portal-shell';
import { PageContainer } from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export default function ProviderProfileLoading() {
  return (
    <PortalShell
      area="provider"
      breadcrumbs={[{ label: 'Provider Profile', href: '/provider/profile' }]}
    >
      <PageContainer maxWidth="7xl">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="space-y-2 pb-2 border-b border-border/50">
            <Skeleton className="h-8 w-60 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-lg" />
          </div>

          {/* Profile Identity Card Skeleton */}
          <Card className="p-6 bg-card/60 border-border/60">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <Skeleton className="h-20 w-20 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <Skeleton className="h-6 w-52 mx-auto sm:mx-0 rounded-lg" />
                  <Skeleton className="h-6 w-28 mx-auto sm:mx-0 rounded-full" />
                </div>
                <Skeleton className="h-4 w-64 mx-auto sm:mx-0 rounded" />
                <div className="flex items-center justify-center sm:justify-start gap-3 pt-1">
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-4 w-24 rounded" />
                </div>
              </div>
            </div>
          </Card>

          {/* Performance metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4 space-y-2 bg-card/50 border-border/60">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-7 w-14 rounded-lg" />
              </Card>
            ))}
          </div>

          {/* Form edit skeleton */}
          <Card className="p-6 bg-card/60 border-border/60 space-y-4">
            <Skeleton className="h-5 w-48 rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
            <Skeleton className="h-9 w-32 rounded-xl mt-2" />
          </Card>
        </div>
      </PageContainer>
    </PortalShell>
  );
}
