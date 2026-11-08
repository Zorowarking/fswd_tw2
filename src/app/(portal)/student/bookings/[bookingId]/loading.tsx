import { PortalShell } from '@/components/layout/portal-shell';
import { PageContainer } from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export default function StudentBookingDetailLoading() {
  return (
    <PortalShell
      area="student"
      breadcrumbs={[
        { label: 'My Bookings', href: '/student/bookings' },
        { label: 'Booking Details', href: '#' },
      ]}
    >
      <PageContainer maxWidth="7xl">
        <div className="space-y-6">
          {/* Top navigation & action skeleton */}
          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-8 w-28 rounded-xl" />
          </div>

          {/* Booking Overview Card Skeleton */}
          <Card className="p-6 bg-card/60 border-border/60 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-8 w-64 rounded-xl" />
                <Skeleton className="h-4 w-40 rounded" />
              </div>
              <Skeleton className="h-12 w-32 rounded-2xl" />
            </div>

            {/* Stepper skeleton */}
            <div className="py-4 border-y border-border/40 grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center text-center space-y-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
              ))}
            </div>

            {/* Grid details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border/40 bg-muted/20 space-y-3">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-5 w-44 rounded" />
                <Skeleton className="h-4 w-36 rounded" />
              </div>
              <div className="p-4 rounded-xl border border-border/40 bg-muted/20 space-y-3">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-5 w-44 rounded" />
                <Skeleton className="h-4 w-36 rounded" />
              </div>
            </div>
          </Card>

          {/* Feedback / Provider section skeleton */}
          <Card className="p-6 bg-card/60 border-border/60 space-y-4">
            <Skeleton className="h-5 w-48 rounded" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </Card>
        </div>
      </PageContainer>
    </PortalShell>
  );
}
