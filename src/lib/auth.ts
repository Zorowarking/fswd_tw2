import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

/**
 * CampusServe Authentication Service Layer (Clerk)
 * Strictly decoupled from application role management.
 * All password handling, MFA, and sessions are managed exclusively by Clerk.
 */

export interface AuthenticatedUserContext {
  userId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  imageUrl: string | null;
}

/**
 * Retrieves the current session auth context on the server
 */
export async function getCurrentAuth() {
  return auth();
}

/**
 * Retrieves the authenticated Clerk user profile details on the server
 */
export async function getCurrentUser(): Promise<AuthenticatedUserContext | null> {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const primaryEmail =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null;

  return {
    userId: user.id,
    email: primaryEmail,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName || [user.firstName, user.lastName].filter(Boolean).join(' ') || null,
    imageUrl: user.imageUrl,
  };
}

/**
 * Server-side guard to guarantee authentication in Server Actions or Page Components
 * Automatically redirects unauthenticated callers to /sign-in
 */
export async function requireAuthentication(returnUrl = '/'): Promise<AuthenticatedUserContext> {
  const { userId } = await auth();

  if (!userId) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`);
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect('/sign-in');
  }

  return user;
}
