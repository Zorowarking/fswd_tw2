import { requireUserWithRole } from '@/lib/auth-role';


/**
 * Portal Layout Guard
 * Ensures every authenticated user accessing any portal workspace
 * has completed authentication and first-time role selection.
 * - Unauthenticated users -> /sign-in
 * - Role is NULL -> /select-role
 */
export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUserWithRole();
  return <>{children}</>;
}
