import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-role';
import { getAdminBookingsData } from '@/app/actions/admin-bookings-actions';
import { AdminBookingsView } from '@/components/admin/bookings/admin-bookings-view';
import { PortalShell } from '@/components/layout/portal-shell';

export const metadata: Metadata = {
  title: 'Campus Bookings Ledger & Queue | CampusServe Admin',
  description:
    'University-wide master booking registry: inspect student work orders, audit electronic payment transactions, track schedule fulfillment, and resolve cancellations.',
};

/**
 * Dedicated Admin Bookings Management Page: /admin/bookings
 * 
 * STRICT ACCESS CONTROL:
 * - Only ADMIN users can access this page (enforces requireAdmin()).
 * - Non-admin users are automatically intercepted and redirected to their respective dashboards.
 * - Unauthenticated users are redirected to /sign-in.
 */
export default async function AdminBookingsPage() {
  await requireAdmin();
  const data = await getAdminBookingsData();

  return (
    <PortalShell
      area="admin"
      breadcrumbs={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Bookings Ledger', active: true },
      ]}
    >
      <AdminBookingsView initialData={data} />
    </PortalShell>
  );
}

