import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-role';
import { Role } from '@prisma/client';


/**
 * Role-Aware Services Dispatcher:
 * - Unauthenticated visitors -> public university service catalog (/#services)
 * - Authenticated users with role = NULL -> strictly /select-role
 * - Students -> student service discovery catalog (/student/services)
 * - Service Providers -> provider service management area (/provider/services)
 * - Administrators -> admin service management area (/admin/dashboard#services)
 */
export default async function ServicesPage() {
  const user = await getCurrentUser();

  // Public access for unauthenticated visitors: redirect to public service showcase
  if (!user) {
    redirect('/#services');
  }

  // Unassigned authenticated users are strictly barred from normal service portals
  if (!user.role) {
    redirect('/select-role');
  }

  // Role-aware dispatching:
  switch (user.role) {
    case Role.STUDENT:
      redirect('/student/services');
    case Role.SERVICE_PROVIDER:
      redirect('/provider/services');
    case Role.ADMIN:
      redirect('/admin/dashboard#services');
    default:
      redirect('/select-role');
  }
}
