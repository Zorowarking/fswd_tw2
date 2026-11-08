import { requireStudent } from '@/lib/auth-role';

/**
 * Route protection layout for /student/*
 * Strictly allows only Role.STUDENT.
 * - Unauthenticated users -> /sign-in
 * - Role is NULL -> /select-role
 * - Wrong role (SERVICE_PROVIDER or ADMIN) -> their respective dashboard
 */
export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireStudent();
  return <>{children}</>;
}
