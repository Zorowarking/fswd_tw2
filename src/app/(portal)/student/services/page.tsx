import { Metadata } from 'next';
import { PortalShell } from '@/components/layout/portal-shell';
import { PageContainer } from '@/components/layout/page-container';
import { StudentServiceDiscoveryView } from '@/components/student/services/student-service-discovery-view';
import { getStudentServices } from '@/app/actions/student-service-actions';


export const metadata: Metadata = {
  title: 'Campus Services Directory | Student Portal',
  description:
    'Explore, filter, and reserve certified campus facilities, academic equipment, and student amenities.',
};

interface StudentServicesPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    price?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function StudentServicesPage({ searchParams }: StudentServicesPageProps) {
  const params = await searchParams;

  const result = await getStudentServices({
    q: params.q,
    category: params.category,
    price: params.price,
    sort: params.sort,
    page: params.page ? parseInt(params.page, 10) : 1,
    pageSize: 9,
  });

  return (
    <PortalShell
      area="student"
      breadcrumbs={[{ label: 'Browse Services', href: '/student/services' }]}
    >
      <PageContainer maxWidth="7xl">
        <StudentServiceDiscoveryView
          initialData={result}
          searchQuery={params.q || ''}
          selectedCategory={params.category || 'all'}
          selectedPrice={params.price || 'all'}
          selectedSort={params.sort || 'featured'}
        />
      </PageContainer>
    </PortalShell>
  );
}

