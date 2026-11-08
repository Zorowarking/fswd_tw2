import { auth, currentUser, verifyToken } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import type { Role, User } from '@prisma/client';

/**
 * Service to reliably synchronize Clerk authenticated users with the Prisma User database.
 * No passwords are ever stored. clerkUserId is enforced as unique constraint.
 * Newly registered users default to a nullable role (role: null).
 */

export interface SyncUserData {
  clerkUserId: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  role?: Role | null;
}

/**
 * Upserts a User record in Prisma given Clerk user payload.
 * Safely handles both clerkUserId and email uniqueness without collisions.
 * When updating, the existing assigned role is preserved unless explicitly provided.
 */
export async function syncUserRecord(data: SyncUserData): Promise<User> {
  const { clerkUserId, email, name, phone, role } = data;

  // Check if a user with this clerkUserId already exists
  const existingByClerkId = await db.user.findUnique({
    where: { clerkUserId },
  });

  if (existingByClerkId) {
    const shouldUpdateEmail = email && !email.startsWith('user_') && existingByClerkId.email.startsWith('user_');
    const shouldUpdateName = name && !name.startsWith('user_') && (!existingByClerkId.name || existingByClerkId.name.startsWith('user_'));

    return db.user.update({
      where: { clerkUserId },
      data: {
        ...(shouldUpdateEmail ? { email } : {}),
        ...(shouldUpdateName ? { name } : {}),
        ...(phone !== undefined && { phone }),
        ...(role !== undefined && { role }),
      },
    });
  }

  // Check if a user with this email already exists (e.g. seed data or previous session)
  const existingByEmail = await db.user.findUnique({
    where: { email },
  });

  if (existingByEmail) {
    // Link the existing user record with the active clerkUserId
    return db.user.update({
      where: { email },
      data: {
        clerkUserId,
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(role !== undefined && { role }),
      },
    });
  }

  const cleanName =
    name && !name.startsWith('user_')
      ? name
      : role === 'ADMIN'
      ? 'Campus Administrator'
      : role === 'SERVICE_PROVIDER'
      ? 'Campus Service Provider'
      : 'Campus Student';

  return db.user.create({
    data: {
      clerkUserId,
      email,
      name: cleanName,
      phone: phone ?? null,
      role: role ?? null, // Nullable initially for newly registered users
    },
  });
}

/**
 * Automatically detects the currently authenticated Clerk user session on the server
 * and ensures a synchronized Prisma User record exists in the database.
 *
 * Resilient, high-performance implementation:
 * 1. Reads session locally via auth() to extract clerkUserId and session claims instantly.
 * 2. Only calls remote currentUser() if CLERK_SECRET_KEY is valid and non-corrupted.
 * 3. Never throws unhandled network errors or hangs on invalid keys.
 */
export async function syncCurrentClerkUser(): Promise<User | null> {
  let clerkUserId: string | null = null;
  let email: string | null = null;
  let name: string | null = null;
  let phone: string | null = null;

  // 1. Try resolving userId via Clerk auth() or resilient session cookie
  try {
    const { userId, sessionClaims } = await auth();
    if (userId) {
      clerkUserId = userId;
      if (sessionClaims) {
        const claims = sessionClaims as Record<string, unknown>;
        email =
          (typeof claims.email === 'string' && claims.email) ||
          (typeof claims.primary_email === 'string' && claims.primary_email) ||
          (typeof claims.email_address === 'string' && claims.email_address) ||
          null;

        name =
          (typeof claims.name === 'string' && claims.name) ||
          (typeof claims.full_name === 'string' && claims.full_name) ||
          [claims.first_name, claims.last_name].filter(Boolean).join(' ') ||
          null;

        phone = (typeof claims.phone_number === 'string' && claims.phone_number) || null;
      }
    }
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'digest' in err) {
      throw err;
    }
    console.warn('[UserSync] auth() claims extraction warning:', err);
  }

  // Cryptographic fallback: verify __session cookie token signature if auth() returned null
  if (!clerkUserId) {
    try {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get('__session')?.value;
      if (sessionCookie && process.env.CLERK_SECRET_KEY) {
        const verified = await verifyToken(sessionCookie, {
          secretKey: process.env.CLERK_SECRET_KEY,
          jwtKey: process.env.CLERK_JWT_KEY,
        });
        if (verified?.sub && typeof verified.sub === 'string' && verified.sub.startsWith('user_')) {
          clerkUserId = verified.sub;
        }
      }
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'digest' in err) {
        throw err;
      }
      // Invalid/forged token — do NOT trust
    }
  }

  if (!clerkUserId) {
    return null;
  }

  // Check if CLERK_SECRET_KEY is valid before calling remote currentUser()
  const secretKey = process.env.CLERK_SECRET_KEY || '';
  const isSecretKeyValid =
    secretKey.startsWith('sk_test_') &&
    !secretKey.includes('…') &&
    !secretKey.includes('...') &&
    secretKey.length > 25;

  if (isSecretKeyValid && (!email || !name)) {
    try {
      const clerkUser = await currentUser();
      if (clerkUser) {
        clerkUserId = clerkUser.id;
        const primaryEmail =
          clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
            ?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;
        if (primaryEmail) {
          email = primaryEmail;
        }
        name =
          clerkUser.fullName ||
          [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
          name;
        phone = clerkUser.phoneNumbers[0]?.phoneNumber ?? phone;
      }
    } catch (err) {
      console.warn('[UserSync] currentUser() remote fetch failed:', err);
    }
  }

  if (!clerkUserId) {
    return null;
  }

  // Ensure unique email constraint is satisfied even in offline/mock fallback mode
  if (!email) {
    email = `${clerkUserId}@campusserve.edu`;
  }

  try {
    const user = await syncUserRecord({
      clerkUserId,
      email,
      name,
      phone,
    });
    return user;
  } catch (err) {
    console.error('[syncCurrentClerkUser] Failed to upsert user record in database:', err);
    return null;
  }
}

/**
 * Assigns or updates the role of a user in Prisma (STUDENT, SERVICE_PROVIDER, ADMIN)
 */
export async function assignUserRole(clerkUserId: string, role: Role): Promise<User> {
  return db.user.update({
    where: { clerkUserId },
    data: { role },
  });
}

/**
 * Retrieves the Prisma application User record by Clerk User ID
 */
export async function getUserByClerkId(clerkUserId: string): Promise<User | null> {
  return db.user.findUnique({
    where: { clerkUserId },
  });
}
