import { requireAdmin } from '@/lib/auth-role';

/**
 * Route protection layout for /admin/*
 * Strictly allows only Role.ADMIN.
 * - Unauthenticated users -> /sign-in
 * - Role is NULL -> /select-role
 * - Wrong role (STUDENT or SERVICE_PROVIDER) -> their respective dashboard
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <>{children}</>;
}
