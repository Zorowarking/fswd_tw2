import { PortalShell } from '@/components/layout/portal-shell';
import { PageContainer } from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminReviewsLoading() {
  return (
    <PortalShell area="admin">
      <PageContainer
        title="Student Reviews Moderation Desk"
        description="Loading student feedback and reviews audit trails..."
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-card border border-border/60 p-4 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-8 w-32" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-muted/40 p-4" />
            ))}
          </div>
        </div>
      </PageContainer>
    </PortalShell>
  );
}

