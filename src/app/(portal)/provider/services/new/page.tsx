import { Metadata } from 'next';
import { PortalShell } from '@/components/layout/portal-shell';
import { PageContainer } from '@/components/layout/page-container';
import { ServiceForm } from '@/components/provider/services/service-form';
import { getActiveCategoriesForServices } from '@/app/actions/service-actions';

export const metadata: Metadata = {
  title: 'Add New Service | Provider Operations Desk',
  description: 'Create and list a new campus service, equipment rental, or facility slot.',
};

export default async function AddServicePage() {
  const categories = await getActiveCategoriesForServices();

  return (
    <PortalShell
      area="provider"
      breadcrumbs={[
        { label: 'My Services', href: '/provider/services' },
        { label: 'New Service', href: '/provider/services/new' },
      ]}
    >
      <PageContainer maxWidth="7xl">
        <ServiceForm categories={categories} mode="create" />
      </PageContainer>
    </PortalShell>
  );
}
