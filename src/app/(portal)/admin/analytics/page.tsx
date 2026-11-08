import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-role';
import { getAdminAnalyticsData } from '@/app/actions/admin-analytics-actions';
import { AdminAnalyticsView } from '@/components/admin/analytics/admin-analytics-view';
import { PortalShell } from '@/components/layout/portal-shell';

export const metadata: Metadata = {
  title: 'Campus Operations Analytics | CampusServe Admin',
  description:
    'Database-driven institutional telemetry, revenue reconciliation, booking trends, provider operational efficiency, and student satisfaction ratings powered by Prisma ORM.',
};

/**
 * Dedicated Admin Analytics & Operations Telemetry Page: /admin/analytics
 * 
 * STRICT ACCESS CONTROL:
 * - Only ADMIN users can access this page (enforces requireAdmin()).
 * - Non-admin users are automatically redirected to their respective dashboards.
 * - Unauthenticated users are redirected to /sign-in.
 * 
 * DATA INTEGRITY:
 * - 100% database-driven analytics via Prisma queries.
 * - No fabricated data.
 */
export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const data = await getAdminAnalyticsData('30d');

  return (
    <PortalShell
      area="admin"
      breadcrumbs={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Analytics & Telemetry', active: true },
      ]}
    >
      <AdminAnalyticsView initialData={data} />
    </PortalShell>
  );
}

