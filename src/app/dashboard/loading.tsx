import { PageContainer } from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export default function DashboardLoading() {
  return (
    <div className="py-8 sm:py-12">
      <PageContainer maxWidth="7xl">
        <div className="space-y-6 animate-pulse">
          <div className="space-y-2 pb-4 border-b border-border/50">
            <Skeleton className="h-8 w-60 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-lg" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-6 space-y-3 bg-card/60 border-border/60">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-5 w-32 rounded" />
                <Skeleton className="h-3 w-48 rounded" />
              </Card>
            ))}
          </div>

          <Card className="p-6 space-y-4 bg-card/60 border-border/60">
            <Skeleton className="h-6 w-44 rounded" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </Card>
        </div>
      </PageContainer>
    </div>
  );
}
