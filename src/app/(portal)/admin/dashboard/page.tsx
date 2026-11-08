import { PortalShell } from '@/components/layout/portal-shell';
import { PageContainer } from '@/components/layout/page-container';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { getAdminDashboardData } from '@/lib/admin-dashboard-data';
import { AdminDashboardView } from '@/components/admin/admin-dashboard-view';
import type { Metadata } from 'next';


export const metadata: Metadata = {
  title: 'Admin Dashboard | CampusServe',
  description:
    'University-wide telemetry: user directory, booking analytics, revenue trends, and service catalog powered by Prisma ORM.',
};

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();

  return (
    <PortalShell
      area="admin"
      breadcrumbs={[{ label: 'Central Administration', active: true }]}
    >
      <PageContainer
        title="Admin Command Dashboard"
        description="Comprehensive university-wide analytics, booking operations, revenue reconciliation, and RBAC user directory."
        badge={
          <StatusIndicator
            status="online"
            label="Neon PostgreSQL Live"
            size="sm"
          />
        }
      >
        <AdminDashboardView data={data} />
      </PageContainer>
    </PortalShell>
  );
}
