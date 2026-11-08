import { Metadata } from 'next';
import { PortalShell } from '@/components/layout/portal-shell';
import { PageContainer } from '@/components/layout/page-container';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { getAdminDashboardData } from '@/lib/admin-dashboard-data';
import { AdminDashboardView } from '@/components/admin/admin-dashboard-view';


export const metadata: Metadata = {
  title: 'Reviews Moderation | Campus Administration',
  description: 'Campus-wide student reviews moderation and feedback management desk.',
};

export default async function AdminReviewsPage() {
  const data = await getAdminDashboardData();

  return (
    <PortalShell
      area="admin"
      breadcrumbs={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Reviews Moderation', active: true },
      ]}
    >
      <PageContainer
        title="Student Reviews Moderation Desk"
        description="Inspect, audit, and moderate student ratings and written feedback across all campus facilities."
        badge={
          <StatusIndicator
            status="online"
            label="Moderation Live"
            size="sm"
          />
        }
      >
        <AdminDashboardView data={data} initialTab="reviews" />
      </PageContainer>
    </PortalShell>
  );
}

