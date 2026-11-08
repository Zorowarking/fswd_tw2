import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PortalShell } from '@/components/layout/portal-shell';
import { PageContainer } from '@/components/layout/page-container';
import { StudentServiceDetailView } from '@/components/student/services/student-service-detail-view';
import { getStudentServiceDetailById } from '@/app/actions/student-service-actions';

interface StudentServicePageProps {
  params: Promise<{ serviceId: string }>;
}

export async function generateMetadata({ params }: StudentServicePageProps): Promise<Metadata> {
  const { serviceId } = await params;
  const service = await getStudentServiceDetailById(serviceId);

  if (!service) {
    return {
      title: 'Service Not Found | Campus Services',
    };
  }

  return {
    title: `${service.name} | Campus Services`,
    description: service.description || `Reserve ${service.name} with verified student pricing.`,
  };
}

export default async function StudentServiceDetailPage({ params }: StudentServicePageProps) {
  const { serviceId } = await params;
  const service = await getStudentServiceDetailById(serviceId);

  if (!service) {
    notFound();
  }

  return (
    <PortalShell
      area="student"
      breadcrumbs={[
        { label: 'Browse Services', href: '/student/services' },
        { label: service.name, href: `/student/services/${service.id}` },
      ]}
    >
      <PageContainer maxWidth="7xl">
        <StudentServiceDetailView service={service} />
      </PageContainer>
    </PortalShell>
  );
}

