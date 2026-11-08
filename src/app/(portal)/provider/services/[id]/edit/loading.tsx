import { PortalShell } from '@/components/layout/portal-shell';
import { PageContainer } from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditServiceLoading() {
  return (
    <PortalShell
      area="provider"
      breadcrumbs={[
        { label: 'My Services', href: '/provider/services' },
        { label: 'Edit Service', href: '#' },
      ]}
    >
      <PageContainer maxWidth="7xl">
        <div className="space-y-8 animate-pulse">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-8 w-64 rounded-xl" />
              <Skeleton className="h-4 w-96 rounded" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 rounded-2xl border border-border/60 bg-card/60 p-6 space-y-4" />
              <div className="h-56 rounded-2xl border border-border/60 bg-card/60 p-6 space-y-4" />
              <div className="h-32 rounded-2xl border border-border/60 bg-card/60 p-6 space-y-4" />
            </div>
            <div className="space-y-6">
              <div className="h-64 rounded-2xl border border-border/60 bg-card/60 p-6 space-y-4" />
              <div className="h-40 rounded-2xl border border-border/60 bg-card/60 p-6 space-y-4" />
            </div>
          </div>
        </div>
      </PageContainer>
    </PortalShell>
  );
}
