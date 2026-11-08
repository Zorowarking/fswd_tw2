import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-role';
import { getAdminUsersData } from '@/app/actions/admin-users-actions';
import { AdminUsersView } from '@/components/admin/users/admin-users-view';
import { PortalShell } from '@/components/layout/portal-shell';

export const metadata: Metadata = {
  title: 'Campus User Directory & Role Management | CampusServe Admin',
  description:
    'Administrative console to inspect campus users, role assignments, booking activity, and execute account actions.',
};

/**
 * Dedicated Admin Users Management Page: /admin/users
 * 
 * STRICT ACCESS CONTROL:
 * - Only ADMIN users can access this page (enforces requireAdmin()).
 * - Non-admin users are automatically intercepted and redirected to their respective dashboards.
 * - Unauthenticated users are redirected to /sign-in.
 */
export default async function AdminUsersPage() {
  await requireAdmin();
  const data = await getAdminUsersData();

  return (
    <PortalShell
      area="admin"
      breadcrumbs={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Users Directory', active: true },
      ]}
    >
      <AdminUsersView initialData={data} />
    </PortalShell>
  );
}

