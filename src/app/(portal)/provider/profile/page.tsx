import type { Metadata } from 'next';
import { getProviderProfileData } from '@/app/actions/provider-profile-actions';
import { ProviderProfileView } from '@/components/provider/profile/provider-profile-view';

export const metadata: Metadata = {
  title: 'Service Provider Profile & Desk Settings | CampusServe',
  description:
    'Manage your campus service provider profile, store coordinates, performance metrics, and account settings.',
};

/**
 * Dedicated Service Provider Profile Page
 * Protected by /provider/layout.tsx (enforces Role.SERVICE_PROVIDER).
 * Displays provider identity, email, phone, list of services, average rating,
 * total bookings, account info, performance summary, and editable business coordinates.
 */
export default async function ProviderProfilePage() {
  const data = await getProviderProfileData();

  return <ProviderProfileView initialData={data} />;
}

