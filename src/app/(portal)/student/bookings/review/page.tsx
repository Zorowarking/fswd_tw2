import { redirect } from 'next/navigation';

interface BookingsReviewRedirectPageProps {
  searchParams: Promise<{
    serviceId?: string;
    date?: string;
    slot?: string;
    notes?: string;
  }>;
}

export default async function BookingsReviewRedirectPage({
  searchParams,
}: BookingsReviewRedirectPageProps) {
  const query = await searchParams;

  if (!query.serviceId) {
    redirect('/student/services');
  }

  const params = new URLSearchParams();
  if (query.date) params.set('date', query.date);
  if (query.slot) params.set('slot', query.slot);
  if (query.notes) params.set('notes', query.notes);

  const queryString = params.toString();
  redirect(
    `/student/services/${query.serviceId}/review${queryString ? `?${queryString}` : ''}`
  );
}

