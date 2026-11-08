'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { Role, NotificationType } from '@prisma/client';
import { syncUserRecord } from '@/lib/user-sync';
import { getRoleDashboardUrl, resolveAuthenticatedUserId } from '@/lib/auth-role';

export interface AuthRedirectResult {
  authenticated: boolean;
  role: Role | null;
  redirectUrl: string;
}

/**
 * Server action to immediately resolve or synchronize an authenticated user
 * and return their definitive destination URL (/select-role or role dashboard).
 */
export async function resolveAuthRedirectAction(clientData?: {
  email?: string;
  name?: string;
}): Promise<AuthRedirectResult> {
  try {
    const userId = await resolveAuthenticatedUserId();

    if (!userId) {
      return {
        authenticated: false,
        role: null,
        redirectUrl: '/sign-in',
      };
    }

    // Fast-path database lookup
    let user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      user = await syncUserRecord({
        clerkUserId: userId,
        email: clientData?.email || `${userId}@campusserve.edu`,
        name: clientData?.name || null,
      });
    } else {
      const incomingName = clientData?.name && !clientData.name.startsWith('user_') ? clientData.name : null;
      const incomingEmail = clientData?.email && !clientData.email.startsWith('user_') ? clientData.email : null;
      const needsNameUpdate = !user.name || user.name.startsWith('user_');
      const needsEmailUpdate = user.email.startsWith('user_') && !!incomingEmail;

      if (needsNameUpdate || needsEmailUpdate) {
        const fallbackName =
          user.role === 'ADMIN'
            ? 'Campus Administrator'
            : user.role === 'SERVICE_PROVIDER'
            ? 'Campus Service Provider'
            : 'Campus Student';

        user = await db.user.update({
          where: { clerkUserId: userId },
          data: {
            ...(needsNameUpdate ? { name: incomingName || fallbackName } : {}),
            ...(needsEmailUpdate ? { email: incomingEmail! } : {}),
          },
        });
      }
    }

    if (!user.role) {
      return {
        authenticated: true,
        role: null,
        redirectUrl: '/select-role',
      };
    }

    return {
      authenticated: true,
      role: user.role,
      redirectUrl: getRoleDashboardUrl(user.role),
    };
  } catch (error) {
    console.error('[resolveAuthRedirectAction] Error:', error);
    return {
      authenticated: false,
      role: null,
      redirectUrl: '/select-role',
    };
  }
}

export interface SelectRoleResult {
  success: boolean;
  role?: Role;
  redirectUrl?: string;
  error?: string;
}

export interface SwitchRoleResult {
  success: boolean;
  role?: Role;
  redirectUrl?: string;
  error?: string;
  activeObligationsCount?: number;
}

/**
 * Server action to save a user's initial role selection in Prisma Neon PostgreSQL.
 * The database is the single source of truth.
 *
 * Prevents unauthorized modification if a role is already set.
 * Admin roles cannot be self-selected.
 */
export async function selectUserRole(
  selectedRole: 'STUDENT' | 'SERVICE_PROVIDER',
  clientData?: { email?: string; name?: string }
): Promise<SelectRoleResult> {
  try {
    const userId = await resolveAuthenticatedUserId();

    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized: You must be signed in with Clerk to select a role.',
      };
    }

    if (selectedRole !== 'STUDENT' && selectedRole !== 'SERVICE_PROVIDER') {
      return {
        success: false,
        error: 'Invalid role selection: Please choose either STUDENT or SERVICE_PROVIDER.',
      };
    }

    // Ensure the user record exists in Prisma
    let user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      user = await syncUserRecord({
        clerkUserId: userId,
        email: clientData?.email || `${userId}@campusserve.edu`,
        name: clientData?.name || null,
      });
    }

    if (!user) {
      return {
        success: false,
        error: 'Failed to find or synchronize user record from authentication session.',
      };
    }

    const incomingName =
      clientData?.name && !clientData.name.startsWith('user_') ? clientData.name : null;
    const incomingEmail =
      clientData?.email && !clientData.email.startsWith('user_') ? clientData.email : null;
    const fallbackName =
      selectedRole === 'SERVICE_PROVIDER' ? 'Campus Service Provider' : 'Campus Student';

    // If the user already has a role set in Prisma, enforce immutability on the first-login flow
    if (user.role) {
      const needsNameUpdate = !user.name || user.name.startsWith('user_');
      const needsEmailUpdate = user.email.startsWith('user_') && !!incomingEmail;
      if (needsNameUpdate || needsEmailUpdate) {
        await db.user.update({
          where: { clerkUserId: userId },
          data: {
            ...(needsNameUpdate ? { name: incomingName || fallbackName } : {}),
            ...(needsEmailUpdate ? { email: incomingEmail! } : {}),
          },
        });
      }

      return {
        success: true,
        role: user.role,
        redirectUrl: getRoleDashboardUrl(user.role),
      };
    }

    // Save the selected role permanently in Prisma Neon PostgreSQL
    const updatedUser = await db.user.update({
      where: { clerkUserId: userId },
      data: {
        role: selectedRole === 'STUDENT' ? Role.STUDENT : Role.SERVICE_PROVIDER,
        ...(!user.name || user.name.startsWith('user_')
          ? { name: incomingName || fallbackName }
          : {}),
        ...(user.email.startsWith('user_') && incomingEmail ? { email: incomingEmail } : {}),
      },
    });

    // Notify admins if a new service provider registered
    if (selectedRole === 'SERVICE_PROVIDER') {
      try {
        const admins = await db.user.findMany({
          where: { role: Role.ADMIN },
          select: { id: true },
        });
        if (admins.length > 0) {
          await db.notification.createMany({
            data: admins.map((admin) => ({
              userId: admin.id,
              type: NotificationType.SYSTEM_ALERT,
              title: 'New Service Provider Registered',
              message: `${updatedUser.name || updatedUser.email} has registered as a new campus service provider.`,
              link: '/admin/users',
            })),
          });
        }
      } catch (notifyErr) {
        console.error('Failed to dispatch admin notification for new provider:', notifyErr);
      }
    }

    try {
      revalidatePath('/', 'layout');
    } catch {
      // Revalidation store not active in test or non-request context
    }

    return {
      success: true,
      role: updatedUser.role ?? undefined,
      redirectUrl: getRoleDashboardUrl(updatedUser.role),
    };
  } catch (err: unknown) {
    console.error('[selectUserRole Error]:', err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'An unexpected database error occurred while saving your role.',
    };
  }
}

/**
 * Returns active booking obligations for the current user if they are a service provider.
 * Used by Profile role switching to warn about open commitments.
 */
export async function getProviderActiveObligations(): Promise<{ activeBookingsCount: number }> {
  try {
    const userId = await resolveAuthenticatedUserId();
    if (!userId) return { activeBookingsCount: 0 };

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true, role: true },
    });

    if (!user || user.role !== Role.SERVICE_PROVIDER) {
      return { activeBookingsCount: 0 };
    }

    const count = await db.booking.count({
      where: {
        service: {
          providerId: user.id,
        },
        status: {
          in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'],
        },
      },
    });

    return { activeBookingsCount: count };
  } catch (err) {
    console.error('[getProviderActiveObligations] Error:', err);
    return { activeBookingsCount: 0 };
  }
}

/**
 * Allows authenticated users to safely switch their account type (STUDENT <-> SERVICE_PROVIDER)
 * from their Profile page.
 *
 * CRITICAL BUSINESS RULES & SECURITY:
 * 1. Admin roles CANNOT be selected or assigned through this action.
 * 2. Only the authenticated user can change their own role.
 * 3. Never deletes existing bookings, services, payments, or reviews.
 * 4. Atomic database update.
 * 5. Revalidates session cache and redirects to the new dashboard.
 */
export async function switchUserRole(
  targetRole: 'STUDENT' | 'SERVICE_PROVIDER'
): Promise<SwitchRoleResult> {
  try {
    const userId = await resolveAuthenticatedUserId();

    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized: You must be signed in with Clerk to change your account type.',
      };
    }

    // Strictly whitelist allowed target roles — ADMIN is never permitted
    if (targetRole !== 'STUDENT' && targetRole !== 'SERVICE_PROVIDER') {
      return {
        success: false,
        error: 'Invalid target role: Only Student and Service Provider roles are selectable.',
      };
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return {
        success: false,
        error: 'User account not found in database.',
      };
    }

    // Admin accounts cannot be converted to general roles through the self-service profile
    if (user.role === Role.ADMIN) {
      return {
        success: false,
        error: 'Administrator accounts cannot be converted using self-service role switching.',
      };
    }

    // If user is already in target role
    if (user.role === targetRole) {
      return {
        success: true,
        role: user.role,
        redirectUrl: getRoleDashboardUrl(user.role),
      };
    }

    // If switching from SERVICE_PROVIDER to STUDENT, verify there are no unresolved provider bookings
    if (user.role === Role.SERVICE_PROVIDER && targetRole === 'STUDENT') {
      const activeBookingsCount = await db.booking.count({
        where: {
          service: {
            providerId: user.id,
          },
          status: {
            in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'],
          },
        },
      });

      if (activeBookingsCount > 0) {
        return {
          success: false,
          activeObligationsCount: activeBookingsCount,
          error: `Cannot change account type: You have ${activeBookingsCount} active or pending booking(s) on your provider services. All active bookings must be completed or resolved before switching to a Student account.`,
        };
      }
    }

    const newRole = targetRole === 'STUDENT' ? Role.STUDENT : Role.SERVICE_PROVIDER;

    // Atomically update role in Neon PostgreSQL without modifying historical entities
    const updatedUser = await db.user.update({
      where: { clerkUserId: userId },
      data: {
        role: newRole,
      },
    });

    // Notify admins if switching into service provider role
    if (newRole === Role.SERVICE_PROVIDER) {
      try {
        const admins = await db.user.findMany({
          where: { role: Role.ADMIN },
          select: { id: true },
        });
        if (admins.length > 0) {
          await db.notification.createMany({
            data: admins.map((admin) => ({
              userId: admin.id,
              type: NotificationType.SYSTEM_ALERT,
              title: 'New Service Provider Account Active',
              message: `${updatedUser.name || updatedUser.email} has switched their role to campus service provider.`,
              link: '/admin/users',
            })),
          });
        }
      } catch (notifyErr) {
        console.error('Failed to dispatch admin notification for switched provider:', notifyErr);
      }
    }

    // Invalidate request/layout caches so the new role is immediately active
    try {
      revalidatePath('/', 'layout');
    } catch {
      // Revalidation store not active in test or non-request context
    }

    return {
      success: true,
      role: updatedUser.role ?? undefined,
      redirectUrl: getRoleDashboardUrl(updatedUser.role),
    };
  } catch (err: unknown) {
    console.error('[switchUserRole Error]:', err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'An unexpected database error occurred while updating your role.',
    };
  }
}

/**
 * Developer & reviewer perspective switcher: allows seamlessly switching between
 * STUDENT, SERVICE_PROVIDER, and ADMIN modes from the portal dropdown menu.
 * Synchronizes the database role and revalidates layout caches.
 */
export async function switchPerspectiveRoleAction(
  targetRole: 'STUDENT' | 'SERVICE_PROVIDER' | 'ADMIN'
): Promise<SwitchRoleResult> {
  try {
    const userId = await resolveAuthenticatedUserId();

    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized: Session expired.',
      };
    }

    const newRole =
      targetRole === 'ADMIN'
        ? Role.ADMIN
        : targetRole === 'SERVICE_PROVIDER'
        ? Role.SERVICE_PROVIDER
        : Role.STUDENT;

    const updatedUser = await db.user.update({
      where: { clerkUserId: userId },
      data: {
        role: newRole,
      },
    });

    try {
      revalidatePath('/', 'layout');
    } catch {
      // Revalidation store not active in test or non-request context
    }

    return {
      success: true,
      role: updatedUser.role ?? undefined,
      redirectUrl: getRoleDashboardUrl(updatedUser.role),
    };
  } catch (err: unknown) {
    console.error('[switchPerspectiveRoleAction Error]:', err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'Failed to switch role perspective in database.',
    };
  }
}
