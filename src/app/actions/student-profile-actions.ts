'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireStudent } from '@/lib/auth-role';
import { BookingStatus, Role } from '@prisma/client';

export interface StudentProfileData {
  id: string;
  clerkUserId: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: Role;
  avatarUrl: string | null;
  createdAt: string;
  formattedJoinedDate: string;
  metrics: {
    totalBookings: number;
    activeBookings: number;
    completedBookings: number;
    totalReviews: number;
  };
}

export interface UpdateStudentProfileInput {
  name: string;
  phone?: string | null;
}

export interface UpdateStudentProfileResult {
  success: boolean;
  error?: string;
  user?: {
    name: string | null;
    phone: string | null;
  };
}

/**
 * Loads the authenticated student's profile information and live campus activity metrics.
 */
export async function getStudentProfileData(): Promise<StudentProfileData> {
  const currentUser = await requireStudent();

  // Load fresh user data with aggregate counts
  const user = await db.user.findUnique({
    where: { id: currentUser.id },
    include: {
      _count: {
        select: {
          bookings: true,
          reviews: true,
          payments: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error('Student user record not found in database.');
  }

  // Count active / pending / in-progress bookings
  const activeBookingsCount = await db.booking.count({
    where: {
      studentId: user.id,
      status: {
        in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS],
      },
    },
  });

  // Count completed bookings
  const completedBookingsCount = await db.booking.count({
    where: {
      studentId: user.id,
      status: BookingStatus.COMPLETED,
    },
  });

  const formattedJoinedDate = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(user.createdAt);

  return {
    id: user.id,
    clerkUserId: user.clerkUserId,
    name: user.name && !user.name.startsWith('user_') ? user.name : 'Campus Student',
    email: user.email.startsWith('user_') && user.email.endsWith('@campusserve.edu') ? 'student@campus.edu' : user.email,
    phone: user.phone,
    role: user.role ?? Role.STUDENT,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
    formattedJoinedDate,
    metrics: {
      totalBookings: user._count.bookings,
      activeBookings: activeBookingsCount,
      completedBookings: completedBookingsCount,
      totalReviews: user._count.reviews,
    },
  };
}

/**
 * Updates application-specific profile fields (name, phone) in Neon PostgreSQL.
 * Passwords and MFA are explicitly managed by Clerk.
 */
export async function updateStudentProfileAction(
  input: UpdateStudentProfileInput
): Promise<UpdateStudentProfileResult> {
  try {
    const currentUser = await requireStudent();

    const trimmedName = input.name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      return {
        success: false,
        error: 'Please provide a valid full name (at least 2 characters).',
      };
    }

    const trimmedPhone = input.phone?.trim() || null;
    if (trimmedPhone && trimmedPhone.length < 7) {
      return {
        success: false,
        error: 'Please provide a valid contact phone number.',
      };
    }

    const updatedUser = await db.user.update({
      where: { id: currentUser.id },
      data: {
        name: trimmedName,
        phone: trimmedPhone,
      },
      select: {
        name: true,
        phone: true,
      },
    });

    try {
      revalidatePath('/student/profile');
      revalidatePath('/student/dashboard');
      revalidatePath('/profile');
    } catch {
      // Ignored outside of request context
    }

    return {
      success: true,
      user: {
        name: updatedUser.name,
        phone: updatedUser.phone,
      },
    };
  } catch (error) {
    console.error('[updateStudentProfileAction] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update profile.',
    };
  }
}

