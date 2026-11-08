import { AuthRedirectClient } from './auth-redirect-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Routing Campus Account | CampusServe',
  description: 'Synchronizing user session and routing to role workspace.',
};

/**
 * Universal Post-Authentication Dispatcher
 * Instant client-aware dispatcher that synchronizes session identity with Neon PostgreSQL
 * and seamlessly routes users:
 * - Unassigned role (role == NULL) -> /select-role
 * - STUDENT -> /student/dashboard
 * - SERVICE_PROVIDER -> /provider/dashboard
 * - ADMIN -> /admin/dashboard
 */
export default function AuthRedirectPage() {
  return <AuthRedirectClient />;
}
