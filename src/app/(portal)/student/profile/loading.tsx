import { PortalShell } from '@/components/layout/portal-shell';
import { PageContainer } from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export default function StudentProfileLoading() {
  return (
    <PortalShell
      area="student"
      breadcrumbs={[{ label: 'Student Profile', href: '/student/profile' }]}
    >
      <PageContainer maxWidth="7xl">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="space-y-2 pb-2 border-b border-border/50">
            <Skeleton className="h-8 w-56 rounded-xl" />
            <Skeleton className="h-4 w-80 rounded-lg" />
          </div>

          {/* Profile Identity Card Skeleton */}
          <Card className="p-6 bg-card/60 border-border/60">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <Skeleton className="h-20 w-20 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <Skeleton className="h-6 w-48 mx-auto sm:mx-0 rounded-lg" />
                  <Skeleton className="h-6 w-24 mx-auto sm:mx-0 rounded-full" />
                </div>
                <Skeleton className="h-4 w-60 mx-auto sm:mx-0 rounded" />
                <Skeleton className="h-4 w-36 mx-auto sm:mx-0 rounded" />
              </div>
            </div>
          </Card>

          {/* Metrics summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4 space-y-2 bg-card/50 border-border/60">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-7 w-12 rounded-lg" />
              </Card>
            ))}
          </div>

          {/* Editable form card */}
          <Card className="p-6 bg-card/60 border-border/60 space-y-4">
            <Skeleton className="h-5 w-44 rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
            <Skeleton className="h-9 w-32 rounded-xl mt-2" />
          </Card>
        </div>
      </PageContainer>
    </PortalShell>
  );
}
