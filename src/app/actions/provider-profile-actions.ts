'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireServiceProvider } from '@/lib/auth-role';
import { BookingStatus, Role } from '@prisma/client';

export interface ProviderServiceSummary {
  id: string;
  name: string;
  category: string;
  price: number;
  durationMinutes: number;
  location: string | null;
  isActive: boolean;
  totalBookings: number;
  averageRating: number;
  totalReviews: number;
  createdAt: string;
}

export interface ProviderReviewSummary {
  id: string;
  rating: number;
  comment: string | null;
  serviceId: string;
  serviceName: string;
  studentName: string;
  studentEmail: string;
  studentAvatarUrl: string | null;
  createdAt: string;
  formattedDate: string;
}

export interface ProviderPerformanceSummary {
  totalServices: number;
  activeServices: number;
  pausedServices: number;
  totalBookings: number;
  completedBookings: number;
  inProgressBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  completionRate: number; // Percentage (0-100)
  totalRevenue: number;
  overallAverageRating: number;
  totalReviews: number;
  ratingBreakdown: {
    fiveStar: number;
    fourStar: number;
    threeStar: number;
    twoStar: number;
    oneStar: number;
  };
}

export interface ProviderProfileData {
  id: string;
  clerkUserId: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: Role;
  avatarUrl: string | null;
  createdAt: string;
  formattedJoinedDate: string;
  services: ProviderServiceSummary[];
  recentReviews: ProviderReviewSummary[];
  performance: ProviderPerformanceSummary;
}

export interface UpdateProviderProfileInput {
  name: string;
  phone?: string | null;
}

export interface UpdateProviderProfileResult {
  success: boolean;
  error?: string;
  user?: {
    name: string | null;
    phone: string | null;
  };
}

/**
 * Loads the authenticated service provider's profile data,
 * list of owned services, customer reviews, and complete performance metrics.
 * 
 * Strict authorization: Only Role.SERVICE_PROVIDER permitted.
 */
export async function getProviderProfileData(): Promise<ProviderProfileData> {
  const currentUser = await requireServiceProvider();

  // Load fresh provider user record
  const user = await db.user.findUnique({
    where: { id: currentUser.id },
  });

  if (!user) {
    throw new Error('Service provider record not found in database.');
  }

  // Fetch all services created by this provider
  const rawServices = await db.service.findMany({
    where: { providerId: user.id },
    include: {
      category: { select: { name: true } },
      bookings: {
        select: {
          id: true,
          status: true,
          amount: true,
        },
      },
      reviews: {
        select: {
          id: true,
          rating: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate per-service metrics
  const services: ProviderServiceSummary[] = rawServices.map((s) => {
    const totalReviews = s.reviews.length;
    const avgRating =
      totalReviews > 0
        ? Number((s.reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1))
        : 0;

    return {
      id: s.id,
      name: s.name,
      category: s.category?.name || 'General Services',
      price: s.price,
      durationMinutes: s.durationMinutes,
      location: s.location,
      isActive: s.isActive,
      totalBookings: s.bookings.length,
      averageRating: avgRating,
      totalReviews,
      createdAt: s.createdAt.toISOString(),
    };
  });

  // Fetch all reviews for this provider's services
  const rawReviews = await db.review.findMany({
    where: {
      service: {
        providerId: user.id,
      },
    },
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
    },
    orderBy: { createdAt: 'desc' },
    take: 25,
  });

  const recentReviews: ProviderReviewSummary[] = rawReviews.map((r) => {
    const date = new Date(r.createdAt);
    return {
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      serviceId: r.service.id,
      serviceName: r.service.name,
      studentName: r.user?.name || 'Campus Student',
      studentEmail: r.user?.email || 'student@campus.edu',
      studentAvatarUrl: r.user?.avatarUrl || null,
      createdAt: r.createdAt.toISOString(),
      formattedDate: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };
  });

  // Aggregate performance across all bookings
  let totalBookings = 0;
  let completedBookings = 0;
  let inProgressBookings = 0;
  let pendingBookings = 0;
  let cancelledBookings = 0;
  let totalRevenue = 0;

  rawServices.forEach((s) => {
    s.bookings.forEach((b) => {
      totalBookings += 1;
      if (b.status === BookingStatus.COMPLETED) {
        completedBookings += 1;
        totalRevenue += b.amount;
      } else if (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.IN_PROGRESS) {
        inProgressBookings += 1;
      } else if (b.status === BookingStatus.PENDING) {
        pendingBookings += 1;
      } else if (b.status === BookingStatus.CANCELLED || b.status === BookingStatus.REJECTED) {
        cancelledBookings += 1;
      }
    });
  });

  const completionRate =
    totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 100;

  // Star breakdown calculation
  const allRatings: number[] = [];
  rawServices.forEach((s) => {
    s.reviews.forEach((r) => {
      allRatings.push(r.rating);
    });
  });

  const totalReviews = allRatings.length;
  const ratingSum = allRatings.reduce((acc, val) => acc + val, 0);
  const overallAverageRating =
    totalReviews > 0 ? Number((ratingSum / totalReviews).toFixed(1)) : 0;

  const ratingBreakdown = {
    fiveStar: allRatings.filter((r) => r === 5).length,
    fourStar: allRatings.filter((r) => r === 4).length,
    threeStar: allRatings.filter((r) => r === 3).length,
    twoStar: allRatings.filter((r) => r === 2).length,
    oneStar: allRatings.filter((r) => r === 1).length,
  };

  const performance: ProviderPerformanceSummary = {
    totalServices: services.length,
    activeServices: services.filter((s) => s.isActive).length,
    pausedServices: services.filter((s) => !s.isActive).length,
    totalBookings,
    completedBookings,
    inProgressBookings,
    pendingBookings,
    cancelledBookings,
    completionRate,
    totalRevenue,
    overallAverageRating,
    totalReviews,
    ratingBreakdown,
  };

  const formattedJoinedDate = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(user.createdAt);

  return {
    id: user.id,
    clerkUserId: user.clerkUserId,
    name: user.name && !user.name.startsWith('user_') ? user.name : 'Campus Service Provider',
    email: user.email.startsWith('user_') && user.email.endsWith('@campusserve.edu') ? 'provider@campus.edu' : user.email,
    phone: user.phone,
    role: user.role ?? Role.SERVICE_PROVIDER,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
    formattedJoinedDate,
    services,
    recentReviews,
    performance,
  };
}

/**
 * Updates the authenticated provider's information in Neon PostgreSQL.
 * 
 * SECURITY GUARANTEE:
 * - Providers can ONLY edit their own information.
 * - currentUser is extracted strictly from verified session tokens via requireServiceProvider().
 * - Target record is bound exclusively to `where: { id: currentUser.id }`.
 * - No arbitrary userId parameter is accepted from the client.
 */
export async function updateProviderProfileAction(
  input: UpdateProviderProfileInput
): Promise<UpdateProviderProfileResult> {
  try {
    const currentUser = await requireServiceProvider();

    const trimmedName = input.name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      return {
        success: false,
        error: 'Please provide a valid business or provider name (at least 2 characters).',
      };
    }

    if (trimmedName.length > 80) {
      return {
        success: false,
        error: 'Provider name cannot exceed 80 characters.',
      };
    }

    const trimmedPhone = input.phone?.trim() || null;
    if (trimmedPhone && trimmedPhone.length < 7) {
      return {
        success: false,
        error: 'Please provide a valid contact phone number (at least 7 digits).',
      };
    }

    // Atomic database update restricted strictly to currentUser.id
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
      revalidatePath('/provider/profile');
      revalidatePath('/provider/dashboard');
      revalidatePath('/provider/services');
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
    console.error('[updateProviderProfileAction] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update provider profile.',
    };
  }
}

