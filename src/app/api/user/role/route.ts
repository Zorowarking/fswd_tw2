import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCurrentUser, resolveAuthenticatedUserId } from '@/lib/auth-role';

/**
 * Returns the current authenticated user's Prisma role.
 * Neon PostgreSQL / Prisma is the single source of truth.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: Request) {
  let { userId } = await auth();

  if (!userId) {
    userId = await resolveAuthenticatedUserId();
  }

  if (!userId) {
    return NextResponse.json({ authenticated: false, role: null });
  }

  try {
    const user = await getCurrentUser();

    return NextResponse.json({
      authenticated: true,
      role: user?.role ?? null,
    });
  } catch (error) {
    console.error('[API /api/user/role] Error fetching role from database:', error);
    return NextResponse.json(
      { authenticated: false, role: null, error: 'Database query failed' },
      { status: 500 }
    );
  }
}
