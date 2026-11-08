import { redirect } from 'next/navigation';
import { getCurrentUser, getRoleDashboardUrl } from '@/lib/auth-role';


export const metadata = {
  title: 'Dashboard Dispatcher | CampusServe',
};

/**
 * Universal Dashboard Entrypoint
 * Routes authenticated users to their specific role dashboard or onboarding:
 * - If user is unauthenticated -> /sign-in?redirect_url=/dashboard
 * - If role is NULL -> /select-role
 * - If role is STUDENT -> /student/dashboard
 * - If role is SERVICE_PROVIDER -> /provider/dashboard
 * - If role is ADMIN -> /admin/dashboard
 */
export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/sign-in?redirect_url=/dashboard');
  }

  if (!user.role) {
    redirect('/select-role');
  }

  redirect(getRoleDashboardUrl(user.role));
}
