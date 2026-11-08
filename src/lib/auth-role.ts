import { cache } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { auth, verifyToken } from '@clerk/nextjs/server';
import { Role, type User } from '@prisma/client';
import { db } from '@/lib/db';
import { syncCurrentClerkUser } from '@/lib/user-sync';

/**
 * Robust helper to resolve the authenticated Clerk User ID.
 * Cryptographically verifies session tokens:
 * 1. Tries official Clerk auth() first.
 * 2. If auth() is unavailable in edge/local transitions, cryptographically validates
 *    the __session cookie signature using Clerk verifyToken() and CLERK_SECRET_KEY.
 * NEVER trusts unverified, forged, or unsigned token payloads.
 */
export async function resolveAuthenticatedUserId(): Promise<string | null> {
  try {
    const { userId } = await auth();
    if (userId) return userId;
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'digest' in err) {
      throw err;
    }
    console.warn('[resolveAuthenticatedUserId] auth() call error:', err);
  }

  // Cryptographic fallback: verify __session cookie token signature with Clerk secret/jwt keys
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;
    if (sessionCookie && process.env.CLERK_SECRET_KEY) {
      const verified = await verifyToken(sessionCookie, {
        secretKey: process.env.CLERK_SECRET_KEY,
        jwtKey: process.env.CLERK_JWT_KEY,
      });
      if (verified?.sub && typeof verified.sub === 'string' && verified.sub.startsWith('user_')) {
        return verified.sub;
      }
    }
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'digest' in err) {
      throw err;
    }
    // Token signature is invalid, forged, or expired — strictly reject
  }

  return null;
}

/**
 * Returns the exact destination dashboard URL for a given Prisma Role.
 * When role is null (newly registered or unassigned), points to /select-role.
 */
export function getRoleDashboardUrl(role: Role | null | undefined): string {
  switch (role) {
    case Role.STUDENT:
      return '/student/dashboard';
    case Role.SERVICE_PROVIDER:
      return '/provider/dashboard';
    case Role.ADMIN:
      return '/admin/dashboard';
    default:
      return '/select-role';
  }
}

/**
 * Resolves the authenticated user from Clerk & Prisma and returns the appropriate redirect URL.
 */
export function resolveUserRedirect(user: User | null): string {
  if (!user) {
    return '/sign-in';
  }
  return getRoleDashboardUrl(user.role);
}

/**
 * Request-level memoized resolver for the currently authenticated User.
 *
 * Performance optimization:
 * 1. Checks session JWT locally via Clerk auth() or resilient cookie payload.
 * 2. Fetches User record via indexed lookup db.user.findUnique({ clerkUserId }).
 * 3. Uses React cache() so identical calls within the same request lifecycle
 *    (e.g., Portal Layout -> Sub-Layout -> Page Component -> Nav) execute only once.
 * 4. Only triggers a remote Clerk API sync when the user record does not exist in Neon DB yet.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  try {
    const userId = await resolveAuthenticatedUserId();

    if (!userId) {
      return null;
    }

    // Fast-path: query Prisma with indexed clerkUserId directly
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (user) {
      return user;
    }

    // First-time sync: create the user record in Neon PostgreSQL
    const synced = await syncCurrentClerkUser();
    return synced;
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'digest' in err) {
      throw err;
    }
    console.error('[getCurrentUser] Error in resolver:', err);
    return null;
  }
});

/**
 * Request-level memoized helper to obtain only the user's role without duplicate queries.
 */
export const getCurrentUserRole = cache(async (): Promise<Role | null> => {
  const user = await getCurrentUser();
  return user?.role ?? null;
});

/**
 * Centralized authorization guard: Enforces that the user is authenticated.
 * If unauthenticated, safely redirects to /sign-in preserving return URL.
 */
export async function requireAuthenticatedUser(returnUrl?: string): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    const signInPath = returnUrl
      ? `/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`
      : '/sign-in';
    redirect(signInPath);
  }

  return user;
}

/**
 * Centralized authorization guard: Enforces that the user is authenticated AND has selected a role.
 * - Unauthenticated users -> /sign-in
 * - Authenticated users with role == NULL -> /select-role
 * - Authenticated users with assigned role -> returns User record
 */
export async function requireAssignedRole(returnUrl?: string): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    const signInPath = returnUrl
      ? `/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`
      : '/sign-in';
    redirect(signInPath);
  }

  if (!user.role) {
    redirect('/select-role');
  }

  return user;
}

/**
 * Centralized authorization guard: Enforces that the user has a specific required role.
 *
 * Rules:
 * - Unauthenticated users -> redirect to /sign-in
 * - Authenticated users with role == NULL -> redirect to /select-role
 * - Authenticated users with the wrong role -> redirect to their correct dashboard
 * - Authenticated users with the allowed role -> returns the user record
 */
export async function requireRole(allowedRole: Role | Role[]): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/sign-in');
  }

  if (!user.role) {
    redirect('/select-role');
  }

  const allowedRoles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];

  if (!allowedRoles.includes(user.role)) {
    // Redirect authenticated user with the wrong role to their correct dashboard
    redirect(getRoleDashboardUrl(user.role));
  }

  return user;
}

/**
 * Dedicated guard for /student/* routes: only Role.STUDENT permitted.
 */
export async function requireStudent(): Promise<User> {
  return requireRole(Role.STUDENT);
}

/**
 * Dedicated guard for /provider/* routes: only Role.SERVICE_PROVIDER permitted.
 */
export async function requireServiceProvider(): Promise<User> {
  return requireRole(Role.SERVICE_PROVIDER);
}

/**
 * Dedicated guard for /admin/* routes: only Role.ADMIN permitted.
 */
export async function requireAdmin(): Promise<User> {
  return requireRole(Role.ADMIN);
}

/**
 * Dedicated guard for /select-role: only authenticated users whose role is NULL.
 *
 * Rules:
 * - Unauthenticated users -> redirect to /sign-in?redirect_url=/select-role
 * - Authenticated users who already have a role -> redirect directly to their dashboard
 * - Authenticated users with role == NULL -> returns user record
 */
export async function requireUnassignedRole(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/sign-in?redirect_url=/select-role');
  }

  if (user.role) {
    // User already has an assigned role; redirect to their correct dashboard
    redirect(getRoleDashboardUrl(user.role));
  }

  return user;
}

/**
 * Compatibility helper to ensure user is authenticated with an assigned role.
 */
export async function requireUserWithRole(): Promise<User> {
  return requireAssignedRole();
}
