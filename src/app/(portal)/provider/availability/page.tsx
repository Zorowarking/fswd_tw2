import { Metadata } from 'next';
import { PortalShell } from '@/components/layout/portal-shell';
import { PageContainer } from '@/components/layout/page-container';
import { AvailabilityManager } from '@/components/provider/availability/availability-manager';
import { getProviderAvailabilityData } from '@/app/actions/availability-actions';

export const metadata: Metadata = {
  title: 'Availability & Calendar Management | Provider Operations',
  description:
    'Manage operating days, recurring slot hours, slot capacity, and blocked dates or maintenance periods.',
};

interface ProviderAvailabilityPageProps {
  searchParams: Promise<{
    serviceId?: string;
  }>;
}

export default async function ProviderAvailabilityPage({
  searchParams,
}: ProviderAvailabilityPageProps) {
  const params = await searchParams;
  const availabilityData = await getProviderAvailabilityData(params.serviceId);

  return (
    <PortalShell
      area="provider"
      breadcrumbs={[
        { label: 'My Services', href: '/provider/services' },
        { label: 'Availability & Calendar', href: '/provider/availability' },
      ]}
    >
      <PageContainer maxWidth="7xl">
        <AvailabilityManager initialData={availabilityData} />
      </PageContainer>
    </PortalShell>
  );
}

