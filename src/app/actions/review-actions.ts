'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getCurrentUser, requireAdmin, requireServiceProvider } from '@/lib/auth-role';
import { Role, NotificationType } from '@prisma/client';

export interface AdminReviewDetail {
  id: string;
  rating: number;
  comment: string | null;
  studentId: string | null;
  studentName: string;
  studentEmail: string;
  studentAvatar: string | null;
  serviceId: string;
  serviceName: string;
  providerId: string | null;
  providerName: string;
  providerEmail: string | null;
  bookingId: string;
  bookingCode: string;
  createdAt: string;
  formattedDate: string;
}

export interface ProviderReviewDetail {
  id: string;
  rating: number;
  comment: string | null;
  studentName: string;
  studentEmail: string;
  studentAvatar: string | null;
  serviceId: string;
  serviceName: string;
  bookingId: string;
  bookingCode: string;
  createdAt: string;
  formattedDate: string;
}

/**
 * Moderates (permanently deletes) a review by an authorized administrator.
 * Enforces strict ADMIN role authorization.
 */
export async function deleteReviewAction(
  reviewId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    if (!reviewId || typeof reviewId !== 'string') {
      return { success: false, error: 'Valid Review ID is required for moderation.' };
    }

    const review = await db.review.findUnique({
      where: { id: reviewId },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            providerId: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        booking: {
          select: {
            bookingCode: true,
          },
        },
      },
    });

    if (!review) {
      return { success: false, error: 'Review not found or has already been moderated.' };
    }

    // Permanently remove the review
    await db.review.delete({
      where: { id: reviewId },
    });

    // Notify student about moderation if student user exists
    if (review.userId) {
      try {
        await db.notification.create({
          data: {
            userId: review.userId,
            title: 'Review Moderated by Admin',
            message: `Your review for booking ${review.booking.bookingCode} (${review.service.name}) was removed by campus administration following content moderation.`,
            link: '/student/bookings',
          },
        });
      } catch (notifyErr) {
        console.error('Failed to notify student of review deletion:', notifyErr);
      }
    }

    // Revalidate relevant pages across portals
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/reviews');
    if (review.serviceId) {
      revalidatePath(`/student/services/${review.serviceId}`);
      revalidatePath(`/provider/services/${review.serviceId}`);
    }
    revalidatePath('/provider/dashboard');

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to moderate review.';
    return { success: false, error: message };
  }
}

/**
 * Retrieves all reviews campus-wide for admin moderation.
 * Enforces strict ADMIN role authorization.
 */
export async function getAdminReviewsAction(): Promise<{
  success: boolean;
  reviews?: AdminReviewDetail[];
  error?: string;
}> {
  try {
    await requireAdmin();

    const rawReviews = await db.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            providerId: true,
            provider: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        booking: {
          select: {
            id: true,
            bookingCode: true,
          },
        },
      },
    });

    const reviews: AdminReviewDetail[] = rawReviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      studentId: r.userId,
      studentName: r.user?.name || 'Verified Student',
      studentEmail: r.user?.email || 'student@campus.edu',
      studentAvatar: r.user?.avatarUrl || null,
      serviceId: r.serviceId,
      serviceName: r.service.name,
      providerId: r.service.providerId,
      providerName: r.service.provider?.name || 'Campus Operations',
      providerEmail: r.service.provider?.email || null,
      bookingId: r.bookingId,
      bookingCode: r.booking.bookingCode,
      createdAt: r.createdAt.toISOString(),
      formattedDate: r.createdAt.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    }));

    return { success: true, reviews };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch reviews.';
    return { success: false, error: message };
  }
}

/**
 * Retrieves reviews for the authenticated provider's services.
 * Enforces strict SERVICE_PROVIDER role authorization.
 */
export async function getProviderReviewsAction(): Promise<{
  success: boolean;
  reviews?: ProviderReviewDetail[];
  error?: string;
}> {
  try {
    const providerUser = await requireServiceProvider();

    const rawReviews = await db.review.findMany({
      where: {
        service: {
          providerId: providerUser.id,
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
          },
        },
        booking: {
          select: {
            id: true,
            bookingCode: true,
          },
        },
      },
    });

    const reviews: ProviderReviewDetail[] = rawReviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      studentName: r.user?.name || 'Verified Student',
      studentEmail: r.user?.email || 'student@campus.edu',
      studentAvatar: r.user?.avatarUrl || null,
      serviceId: r.serviceId,
      serviceName: r.service.name,
      bookingId: r.bookingId,
      bookingCode: r.booking.bookingCode,
      createdAt: r.createdAt.toISOString(),
      formattedDate: r.createdAt.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    }));

    return { success: true, reviews };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch provider reviews.';
    return { success: false, error: message };
  }
}

/**
 * Reports a review for administrator moderation.
 * Generates an in-app alert notification for all campus administrators.
 */
export async function reportReviewAction(
  reviewId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'You must be signed in to report a review.' };
    }

    if (!reviewId || typeof reviewId !== 'string') {
      return { success: false, error: 'Invalid review ID.' };
    }

    if (!reason || !reason.trim()) {
      return { success: false, error: 'Please provide a reason for reporting this review.' };
    }

    const review = await db.review.findUnique({
      where: { id: reviewId },
      include: {
        service: { select: { id: true, name: true } },
      },
    });

    if (!review) {
      return { success: false, error: 'Review not found.' };
    }

    // Notify all admin users
    const admins = await db.user.findMany({
      where: { role: Role.ADMIN },
      select: { id: true },
    });
    if (admins.length > 0) {
      await db.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: NotificationType.SYSTEM_ALERT,
          title: 'Review Reported for Moderation',
          message: `Review on "${review.service.name}" was flagged by ${user.name || user.email}. Reason: "${reason.trim().slice(0, 120)}".`,
          link: '/admin/reviews',
        })),
      });
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to submit report.';
    return { success: false, error: message };
  }
}
