import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-role';
import { getAdminServicesData } from '@/app/actions/admin-services-actions';
import { AdminServicesView } from '@/components/admin/services/admin-services-view';
import { PortalShell } from '@/components/layout/portal-shell';

export const metadata: Metadata = {
  title: 'Campus Services Directory & Moderation | CampusServe Admin',
  description:
    'Administrative moderation desk to audit campus amenities, manage active statuses, inspect providers, and maintain service quality.',
};

/**
 * Dedicated Admin Services Management Page: /admin/services
 * 
 * STRICT ACCESS CONTROL:
 * - Only ADMIN users can access this page (enforces requireAdmin()).
 * - Non-admin users are automatically intercepted and redirected to their respective dashboards.
 * - Unauthenticated users are redirected to /sign-in.
 */
export default async function AdminServicesPage() {
  await requireAdmin();
  const data = await getAdminServicesData();

  return (
    <PortalShell
      area="admin"
      breadcrumbs={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Services Catalog', active: true },
      ]}
    >
      <AdminServicesView initialData={data} />
    </PortalShell>
  );
}

