import { PortalShell } from '@/components/layout/portal-shell';
import { PageContainer } from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export default function BookingReviewLoading() {
  return (
    <PortalShell
      area="student"
      breadcrumbs={[
        { label: 'Browse Services', href: '/student/services' },
        { label: 'Review Booking', href: '#' },
      ]}
    >
      <PageContainer maxWidth="7xl">
        <div className="space-y-6">
          {/* Header & Steps */}
          <div className="space-y-2 pb-4 border-b border-border/50">
            <Skeleton className="h-4 w-36 rounded" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <Skeleton className="h-8 w-72 rounded-xl" />
                <Skeleton className="h-4 w-96 rounded-lg mt-1" />
              </div>
              <Skeleton className="h-6 w-52 rounded-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Details skeleton */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 bg-card/60 border-border/60 space-y-4">
                <div className="flex gap-4">
                  <Skeleton className="h-24 w-24 rounded-2xl shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-3/4 rounded" />
                    <Skeleton className="h-4 w-1/2 rounded" />
                    <Skeleton className="h-4 w-1/3 rounded" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/40">
                  <Skeleton className="h-14 rounded-xl" />
                  <Skeleton className="h-14 rounded-xl" />
                </div>
              </Card>

              <Card className="p-6 bg-card/60 border-border/60 space-y-3">
                <Skeleton className="h-5 w-40 rounded" />
                <Skeleton className="h-20 w-full rounded-xl" />
              </Card>
            </div>

            {/* Right Col: Price Breakdown & CTA */}
            <div className="space-y-4">
              <Card className="p-6 bg-card/60 border-border/60 space-y-4">
                <Skeleton className="h-6 w-36 rounded" />
                <div className="space-y-2.5 pt-2 border-t border-border/40">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="h-4 w-16 rounded" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-28 rounded" />
                    <Skeleton className="h-4 w-16 rounded" />
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border/40">
                    <Skeleton className="h-5 w-24 rounded" />
                    <Skeleton className="h-6 w-20 rounded" />
                  </div>
                </div>
                <Skeleton className="h-12 w-full rounded-xl mt-4" />
              </Card>
            </div>
          </div>
        </div>
      </PageContainer>
    </PortalShell>
  );
}
