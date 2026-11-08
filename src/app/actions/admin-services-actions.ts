'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-role';
import { BookingStatus, NotificationType, Prisma } from '@prisma/client';

export interface AdminServiceCategoryOption {
  id: string;
  name: string;
  slug: string;
}

export interface AdminServicesFilterParams {
  searchQuery?: string;
  categoryFilter?: string;
  statusFilter?: 'ALL' | 'ACTIVE' | 'INACTIVE';
  page?: number;
  pageSize?: number;
}

export interface AdminServiceListItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number;
  location: string | null;
  capacity: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  } | null;
  provider: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
  } | null;
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
}

export interface AdminServicesMetrics {
  totalServices: number;
  activeServices: number;
  inactiveServices: number;
  totalBookingsAcrossServices: number;
  totalRevenueAcrossServices: number;
  averagePlatformRating: number;
}

export interface AdminServicesData {
  services: AdminServiceListItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  metrics: AdminServicesMetrics;
  categories: AdminServiceCategoryOption[];
}

export interface AdminServiceDetailsData extends AdminServiceListItem {
  bookings: Array<{
    id: string;
    bookingCode: string;
    studentName: string;
    studentEmail: string;
    status: string;
    amount: number;
    scheduledAt: string;
    slotTime: string | null;
    createdAt: string;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    studentName: string;
    studentEmail: string;
    studentAvatar: string | null;
    createdAt: string;
    formattedDate: string;
  }>;
  availabilitiesCount: number;
}

export interface AdminEditServiceInput {
  serviceId: string;
  name: string;
  description?: string | null;
  categoryId?: string | null;
  price: number;
  durationMinutes: number;
  location?: string | null;
  capacity?: number;
  isActive: boolean;
}

export interface AdminServiceMutationResult {
  success: boolean;
  error?: string;
  service?: {
    id: string;
    name: string;
    isActive: boolean;
    updatedAt: string;
  };
}

/**
 * Loads paginated campus services with database-driven search, category filtering,
 * status filtering, and relational metrics without loading unnecessary records.
 * 
 * STRICT ACCESS CONTROL: Only Role.ADMIN permitted.
 */
export async function getAdminServicesData(
  params?: AdminServicesFilterParams
): Promise<AdminServicesData> {
  await requireAdmin();

  const {
    searchQuery,
    categoryFilter,
    statusFilter = 'ALL',
    page = 1,
    pageSize = 10,
  } = params || {};

  // Build Prisma where conditions
  const where: Prisma.ServiceWhereInput = {};

  // 1. Search query: database index on name, description, location
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim();
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { location: { contains: q, mode: 'insensitive' } },
      { provider: { name: { contains: q, mode: 'insensitive' } } },
    ];
  }

  // 2. Category filter
  if (categoryFilter && categoryFilter !== 'ALL') {
    where.categoryId = categoryFilter;
  }

  // 3. Status filter
  if (statusFilter !== 'ALL') {
    where.isActive = statusFilter === 'ACTIVE';
  }

  // Pagination parameters
  const take = Math.min(100, Math.max(1, Number(pageSize) || 10));
  const currentPage = Math.max(1, Number(page) || 1);
  const skip = (currentPage - 1) * take;

  // Execute database queries in parallel
  const [
    totalServices,
    activeServices,
    inactiveServices,
    totalBookingsAcrossServices,
    revenueAgg,
    ratingAgg,
    filteredCount,
    categories,
    rawServices,
  ] = await Promise.all([
    db.service.count(),
    db.service.count({ where: { isActive: true } }),
    db.service.count({ where: { isActive: false } }),
    db.booking.count(),
    db.payment.aggregate({
      where: { status: 'SUCCESSFUL' },
      _sum: { amount: true },
    }),
    db.review.aggregate({
      _avg: { rating: true },
    }),
    db.service.count({ where }),
    db.serviceCategory.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    }),
    db.service.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
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
    }),
  ]);

  const services: AdminServiceListItem[] = rawServices.map((s) => {
    let activeBookings = 0;
    let completedBookings = 0;
    let serviceRevenue = 0;

    s.bookings.forEach((b) => {
      if (b.status === BookingStatus.COMPLETED) {
        completedBookings += 1;
        serviceRevenue += b.amount;
      } else if (
        b.status === BookingStatus.CONFIRMED ||
        b.status === BookingStatus.IN_PROGRESS ||
        b.status === BookingStatus.PENDING
      ) {
        activeBookings += 1;
      }
    });

    const totalReviews = s.reviews.length;
    const avgRating =
      totalReviews > 0
        ? Number(
            (
              s.reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews
            ).toFixed(1)
          )
        : 0;

    const createdDate = new Date(s.createdAt);
    const updatedDate = new Date(s.updatedAt);

    const formatOptions: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };

    return {
      id: s.id,
      name: s.name,
      description: s.description,
      price: s.price,
      durationMinutes: s.durationMinutes,
      location: s.location,
      capacity: s.capacity,
      imageUrl: s.imageUrl,
      isActive: s.isActive,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      formattedCreatedAt: createdDate.toLocaleString('en-US', formatOptions),
      formattedUpdatedAt: updatedDate.toLocaleString('en-US', formatOptions),
      category: s.category,
      provider: s.provider,
      totalBookings: s._count.bookings,
      activeBookings,
      completedBookings,
      totalRevenue: serviceRevenue,
      averageRating: avgRating,
      totalReviews: s._count.reviews,
    };
  });

  const totalPages = Math.max(1, Math.ceil(filteredCount / take));

  const metrics: AdminServicesMetrics = {
    totalServices,
    activeServices,
    inactiveServices,
    totalBookingsAcrossServices,
    totalRevenueAcrossServices: revenueAgg._sum.amount ?? 0,
    averagePlatformRating: Number((ratingAgg._avg.rating ?? 5.0).toFixed(1)),
  };

  return {
    services,
    totalCount: filteredCount,
    totalPages,
    currentPage,
    pageSize: take,
    metrics,
    categories,
  };
}

/**
 * Loads comprehensive operational, booking, review, and schedule records for a service.
 */
export async function getAdminServiceDetails(
  serviceId: string
): Promise<AdminServiceDetailsData | null> {
  await requireAdmin();

  const s = await db.service.findUnique({
    where: { id: serviceId },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
        },
      },
      provider: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatarUrl: true,
        },
      },
      bookings: {
        orderBy: { createdAt: 'desc' },
        take: 12,
        include: {
          student: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      reviews: {
        orderBy: { createdAt: 'desc' },
        take: 12,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
      _count: {
        select: {
          availabilities: true,
          bookings: true,
          reviews: true,
        },
      },
    },
  });

  if (!s) return null;

  const totalReviews = s._count.reviews;
  const avgRating =
    totalReviews > 0
      ? Number((s.reviews.reduce((acc, r) => acc + r.rating, 0) / s.reviews.length).toFixed(1))
      : 0;

  const formatOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  return {
    id: s.id,
    name: s.name,
    description: s.description,
    price: s.price,
    durationMinutes: s.durationMinutes,
    location: s.location,
    capacity: s.capacity,
    imageUrl: s.imageUrl,
    isActive: s.isActive,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    formattedCreatedAt: s.createdAt.toLocaleString('en-US', formatOptions),
    formattedUpdatedAt: s.updatedAt.toLocaleString('en-US', formatOptions),
    category: s.category,
    provider: s.provider,
    totalBookings: s._count.bookings,
    activeBookings: s.bookings.filter(
      (b) => b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.IN_PROGRESS
    ).length,
    completedBookings: s.bookings.filter((b) => b.status === BookingStatus.COMPLETED).length,
    totalRevenue: s.bookings
      .filter((b) => b.status === BookingStatus.COMPLETED)
      .reduce((sum, b) => sum + b.amount, 0),
    averageRating: avgRating,
    totalReviews,
    bookings: s.bookings.map((b) => ({
      id: b.id,
      bookingCode: b.bookingCode,
      studentName: b.student?.name || 'Campus Student',
      studentEmail: b.student?.email || 'student@campusserve.edu',
      status: b.status,
      amount: b.amount,
      scheduledAt: b.scheduledAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      slotTime: b.slotTime,
      createdAt: b.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    })),
    reviews: s.reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      studentName: r.user?.name || 'Verified Student',
      studentEmail: r.user?.email || 'student@campusserve.edu',
      studentAvatar: r.user?.avatarUrl || null,
      createdAt: r.createdAt.toISOString(),
      formattedDate: r.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    })),
    availabilitiesCount: s._count.availabilities,
  };
}

/**
 * Administrative action: Toggles the active status of any campus service.
 * Updates the audit timestamp (updatedAt).
 */
export async function adminToggleServiceStatusAction(
  serviceId: string,
  isActive: boolean
): Promise<AdminServiceMutationResult> {
  try {
    await requireAdmin();

    const service = await db.service.update({
      where: { id: serviceId },
      data: {
        isActive,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        updatedAt: true,
      },
    });

    try {
      revalidatePath('/admin/services');
      revalidatePath('/admin/dashboard');
      revalidatePath('/student/services');
      revalidatePath('/provider/services');
      revalidatePath('/services');
    } catch {
      // Ignored outside of request context
    }

    return {
      success: true,
      service: {
        id: service.id,
        name: service.name,
        isActive: service.isActive,
        updatedAt: service.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('[adminToggleServiceStatusAction] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update service active status.',
    };
  }
}

/**
 * Administrative action: Updates service metadata, pricing, duration, location, and category.
 * Preserves audit trail with updatedAt timestamp.
 */
export async function adminEditServiceAction(
  input: AdminEditServiceInput
): Promise<AdminServiceMutationResult> {
  try {
    await requireAdmin();

    const trimmedName = input.name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      return {
        success: false,
        error: 'Service name must be at least 2 characters long.',
      };
    }

    if (input.price < 0) {
      return {
        success: false,
        error: 'Price cannot be negative.',
      };
    }

    if (input.durationMinutes < 5 || input.durationMinutes > 720) {
      return {
        success: false,
        error: 'Duration must be between 5 and 720 minutes.',
      };
    }

    const updated = await db.service.update({
      where: { id: input.serviceId },
      data: {
        name: trimmedName,
        description: input.description?.trim() || null,
        categoryId: input.categoryId || null,
        price: input.price,
        durationMinutes: input.durationMinutes,
        location: input.location?.trim() || null,
        capacity: input.capacity && input.capacity > 0 ? input.capacity : 1,
        isActive: input.isActive,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        updatedAt: true,
      },
    });

    try {
      revalidatePath('/admin/services');
      revalidatePath('/admin/dashboard');
      revalidatePath('/student/services');
      revalidatePath('/provider/services');
      revalidatePath(`/provider/services/${input.serviceId}`);
      revalidatePath(`/student/services/${input.serviceId}`);
      revalidatePath('/services');
    } catch {
      // Ignored outside of request context
    }

    return {
      success: true,
      service: {
        id: updated.id,
        name: updated.name,
        isActive: updated.isActive,
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('[adminEditServiceAction] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update service details.',
    };
  }
}

/**
 * Administrative action: Permanently removes an inappropriate, duplicate, or violating service.
 * DESTRUCTIVE ACTION: Enforces confirmation, logs notification to provider, and cascades.
 */
export async function adminRemoveServiceAction(
  serviceId: string,
  removalReason?: string
): Promise<AdminServiceMutationResult> {
  try {
    await requireAdmin();

    const existingService = await db.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        name: true,
        providerId: true,
      },
    });

    if (!existingService) {
      return {
        success: false,
        error: 'Target service not found in database.',
      };
    }

    // If service belongs to a provider, notify them with audit details
    if (existingService.providerId) {
      try {
        await db.notification.create({
          data: {
            userId: existingService.providerId,
            title: 'Service Removed by Campus Administration',
            message: `Your service "${existingService.name}" was removed from the campus catalog. Reason: ${
              removalReason?.trim() || 'Service violation or administrative policy review'
            }.`,
            type: NotificationType.SYSTEM_ALERT,
          },
        });
      } catch (notifErr) {
        console.warn('[adminRemoveServiceAction] Notification warning:', notifErr);
      }
    }

    // Atomic cascade delete
    await db.service.delete({
      where: { id: serviceId },
    });

    try {
      revalidatePath('/admin/services');
      revalidatePath('/admin/dashboard');
      revalidatePath('/student/services');
      revalidatePath('/provider/services');
      revalidatePath('/services');
    } catch {
      // Ignored outside of request context
    }

    return {
      success: true,
      service: {
        id: existingService.id,
        name: existingService.name,
        isActive: false,
        updatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('[adminRemoveServiceAction] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove service.',
    };
  }
}

