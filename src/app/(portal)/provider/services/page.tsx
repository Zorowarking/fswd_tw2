import { Metadata } from 'next';
import { PortalShell } from '@/components/layout/portal-shell';
import { PageContainer } from '@/components/layout/page-container';
import { MyServicesView } from '@/components/provider/services/my-services-view';
import { getMyServices, getActiveCategoriesForServices } from '@/app/actions/service-actions';

export const metadata: Metadata = {
  title: 'My Services | Provider Operations Desk',
  description: 'Manage, list, edit, activate and configure your campus service offerings.',
};

export default async function ProviderServicesPage() {
  const [services, categories] = await Promise.all([
    getMyServices(),
    getActiveCategoriesForServices(),
  ]);

  return (
    <PortalShell
      area="provider"
      breadcrumbs={[{ label: 'My Services', href: '/provider/services' }]}
    >
      <PageContainer maxWidth="7xl">
        <MyServicesView initialServices={services} categories={categories} />
      </PageContainer>
    </PortalShell>
  );
}

