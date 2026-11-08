import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PortalShell } from '@/components/layout/portal-shell';
import { PageContainer } from '@/components/layout/page-container';
import { ServiceDetailView } from '@/components/provider/services/service-detail-view';
import { getMyServiceById } from '@/app/actions/service-actions';

interface ServicePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { id } = await params;
  const service = await getMyServiceById(id);

  if (!service) {
    return {
      title: 'Service Not Found | Provider Desk',
    };
  }

  return {
    title: `${service.name} | Service Details`,
    description: service.description || `Manage service parameters for ${service.name}.`,
  };
}

export default async function ServiceDetailsPage({ params }: ServicePageProps) {
  const { id } = await params;
  const service = await getMyServiceById(id);

  if (!service) {
    notFound();
  }

  return (
    <PortalShell
      area="provider"
      breadcrumbs={[
        { label: 'My Services', href: '/provider/services' },
        { label: service.name, href: `/provider/services/${service.id}` },
      ]}
    >
      <PageContainer maxWidth="7xl">
        <ServiceDetailView initialService={service} />
      </PageContainer>
    </PortalShell>
  );
}
