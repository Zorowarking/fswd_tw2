import { getProviderDashboardData } from '@/lib/provider-dashboard-data';
import { ProviderDashboardView } from '@/components/provider/provider-dashboard-view';
import type { Metadata } from 'next';


export const metadata: Metadata = {
  title: 'Service Provider Desk | CampusServe',
  description:
    'Campus service provider operations desk for queue management, fulfillment, and revenue audits.',
};

/**
 * Server page component for /provider/dashboard
 * Protected by /provider/layout.tsx (only Role.SERVICE_PROVIDER permitted).
 * Retrieves real user and database state, and renders dynamic dashboard.
 */
export default async function ProviderDashboardPage() {
  const data = await getProviderDashboardData();

  return <ProviderDashboardView initialData={data} />;
}
