import { redirect } from 'next/navigation';
import { getCurrentUser, getRoleDashboardUrl } from '@/lib/auth-role';
import { RoleSelectionView } from '@/components/role-selection/role-selection-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Select Your Campus Role | CampusServe',
  description:
    'Choose your initial role as a Student or Service Provider to configure your CampusServe workspace.',
};

/**
 * First-login role selection page.
 * - Authenticated users who already have a role are immediately routed to their dashboard.
 * - Users with role == NULL are presented the dedicated role selection screen.
 * - Unauthenticated users are redirected to /sign-in by RoleSelectionView.
 */
export default async function SelectRolePage() {
  const user = await getCurrentUser();

  if (user?.role) {
    redirect(getRoleDashboardUrl(user.role));
  }

  return <RoleSelectionView />;
}
