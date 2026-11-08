import { requireServiceProvider } from '@/lib/auth-role';

/**
 * Route protection layout for /provider/*
 * Strictly allows only Role.SERVICE_PROVIDER.
 * - Unauthenticated users -> /sign-in
 * - Role is NULL -> /select-role
 * - Wrong role (STUDENT or ADMIN) -> their respective dashboard
 */
export default async function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireServiceProvider();
  return <>{children}</>;
}
