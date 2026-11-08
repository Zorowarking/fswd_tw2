import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PortalShell } from '@/components/layout/portal-shell';
import { PageContainer } from '@/components/layout/page-container';
import { BookingReviewView } from '@/components/student/booking/booking-review-view';
import { getBookingReviewSummary } from '@/app/actions/booking-actions';


interface BookingReviewPageProps {
  params: Promise<{ serviceId: string }>;
  searchParams: Promise<{
    date?: string;
    slot?: string;
    notes?: string;
  }>;
}

export async function generateMetadata({
  params,
}: BookingReviewPageProps): Promise<Metadata> {
  const { serviceId } = await params;
  return {
    title: 'Review Booking & Checkout | Campus Services',
    description: `Review service schedule, facility details, and pricing before payment for service ${serviceId}.`,
  };
}

export default async function BookingReviewPage({
  params,
  searchParams,
}: BookingReviewPageProps) {
  const { serviceId } = await params;
  const query = await searchParams;

  const reviewData = await getBookingReviewSummary({
    serviceId,
    date: query.date,
    slot: query.slot,
    notes: query.notes,
  });

  if (!reviewData) {
    notFound();
  }

  return (
    <PortalShell
      area="student"
      breadcrumbs={[
        { label: 'Browse Services', href: '/student/services' },
        { label: reviewData.service.name, href: `/student/services/${reviewData.service.id}` },
        { label: 'Booking Review', href: `/student/services/${reviewData.service.id}/review` },
      ]}
    >
      <PageContainer maxWidth="7xl">
        <BookingReviewView initialReviewData={reviewData} />
      </PageContainer>
    </PortalShell>
  );
}

