import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PortalShell } from '@/components/layout/portal-shell';
import { PageContainer } from '@/components/layout/page-container';
import { ServiceForm } from '@/components/provider/services/service-form';
import { getMyServiceById, getActiveCategoriesForServices } from '@/app/actions/service-actions';

interface EditServicePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditServicePageProps): Promise<Metadata> {
  const { id } = await params;
  const service = await getMyServiceById(id);

  if (!service) {
    return {
      title: 'Service Not Found | Provider Desk',
    };
  }

  return {
    title: `Edit ${service.name} | Provider Operations Desk`,
    description: `Update pricing, capacity, schedule and location for ${service.name}.`,
  };
}

export default async function EditServicePage({ params }: EditServicePageProps) {
  const { id } = await params;
  const [service, categories] = await Promise.all([
    getMyServiceById(id),
    getActiveCategoriesForServices(),
  ]);

  if (!service) {
    notFound();
  }

  return (
    <PortalShell
      area="provider"
      breadcrumbs={[
        { label: 'My Services', href: '/provider/services' },
        { label: service.name, href: `/provider/services/${service.id}` },
        { label: 'Edit', href: `/provider/services/${service.id}/edit` },
      ]}
    >
      <PageContainer maxWidth="7xl">
        <ServiceForm
          categories={categories}
          mode="edit"
          serviceId={service.id}
          initialData={{
            name: service.name,
            categoryId: service.categoryId || undefined,
            price: service.price,
            durationMinutes: service.durationMinutes,
            capacity: service.capacity,
            location: service.location || '',
            description: service.description || '',
            imageUrl: service.imageUrl || '',
            isActive: service.isActive,
          }}
        />
      </PageContainer>
    </PortalShell>
  );
}
