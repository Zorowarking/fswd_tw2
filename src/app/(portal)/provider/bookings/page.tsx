import type { Metadata } from 'next';
import { requireServiceProvider } from '@/lib/auth-role';
import { getProviderBookingsAction } from '@/app/actions/provider-booking-actions';
import { ProviderBookingListView } from '@/components/provider/bookings/provider-booking-list-view';

export const metadata: Metadata = {
  title: 'Booking Queue & Management | Provider Portal',
  description:
    'Review student booking requests, accept or reject reservations, and track service fulfillment.',
};

/**
 * Route: /provider/bookings
 *
 * STRICT SERVER-SIDE AUTHORIZATION:
 * - Route guarded by requireServiceProvider() (Role.SERVICE_PROVIDER only)
 * - Queries strictly scoped to services belonging to the authenticated provider
 * - Providers can NEVER access, accept, or reject bookings for other providers
 */
export default async function ProviderBookingsPage() {
  await requireServiceProvider();
  const bookingsData = await getProviderBookingsAction();

  return (
    <div className="container max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <ProviderBookingListView initialData={bookingsData} />
    </div>
  );
}

