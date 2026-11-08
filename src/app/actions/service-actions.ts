'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireServiceProvider } from '@/lib/auth-role';
import { serviceSchema, type ServiceFormData } from '@/lib/validations/service';
import { BookingStatus } from '@prisma/client';

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ProviderServiceListItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number;
  capacity: number;
  location: string | null;
  imageUrl: string | null;
  isActive: boolean;
  categoryId: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  categorySlug: string | null;
  totalBookings: number;
  activeBookings: number;
  canDelete: boolean;
  deleteRestrictionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderServiceDetail extends ProviderServiceListItem {
  providerId: string | null;
  providerName: string | null;
  providerEmail: string | null;
  recentBookings: Array<{
    id: string;
    bookingCode: string;
    studentName: string | null;
    studentEmail: string;
    status: string;
    amount: number;
    scheduledAt: string;
    slotTime: string | null;
  }>;
  reviewsSummary: {
    averageRating: number;
    totalReviews: number;
  };
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    studentName: string;
    studentEmail: string;
    studentAvatar: string | null;
    bookingCode: string;
    createdAt: string;
  }>;
}

export interface ServiceCategoryOption {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

/**
 * Returns all active categories for the service creation/editing dropdowns.
 */
export async function getActiveCategoriesForServices(): Promise<ServiceCategoryOption[]> {
  const categories = await db.serviceCategory.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
    },
  });

  return categories;
}

/**
 * Fetches all services belonging exclusively to the currently authenticated provider.
 * Strictly checks role and scopes queries to `providerId === user.id`.
 */
export async function getMyServices(): Promise<ProviderServiceListItem[]> {
  const user = await requireServiceProvider();

  const services = await db.service.findMany({
    where: {
      providerId: user.id,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          icon: true,
          slug: true,
        },
      },
      bookings: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
  });

  return services.map((s) => {
    const totalBookings = s.bookings.length;
    const activeBookings = s.bookings.filter(
      (b) =>
        b.status === BookingStatus.PENDING ||
        b.status === BookingStatus.CONFIRMED ||
        b.status === BookingStatus.IN_PROGRESS
    ).length;

    let canDelete = true;
    let deleteRestrictionReason: string | null = null;

    if (activeBookings > 0) {
      canDelete = false;
      deleteRestrictionReason = `Service has ${activeBookings} active booking(s) pending fulfillment. Deactivate instead.`;
    } else if (totalBookings > 0) {
      canDelete = false;
      deleteRestrictionReason = `Service has ${totalBookings} historical booking records. Deactivate instead to preserve student booking history.`;
    }

    return {
      id: s.id,
      name: s.name,
      description: s.description,
      price: s.price,
      durationMinutes: s.durationMinutes,
      capacity: s.capacity,
      location: s.location,
      imageUrl: s.imageUrl,
      isActive: s.isActive,
      categoryId: s.categoryId,
      categoryName: s.category?.name || 'Uncategorized',
      categoryIcon: s.category?.icon || null,
      categorySlug: s.category?.slug || null,
      totalBookings,
      activeBookings,
      canDelete,
      deleteRestrictionReason,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  });
}

/**
 * Fetches single service details for the current provider.
 * Guarantees ownership: if the service does not belong to the user, returns null.
 */
export async function getMyServiceById(id: string): Promise<ProviderServiceDetail | null> {
  const user = await requireServiceProvider();

  const service = await db.service.findFirst({
    where: {
      id,
      providerId: user.id,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          icon: true,
          slug: true,
        },
      },
      provider: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      bookings: {
        orderBy: { createdAt: 'desc' },
        take: 10,
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
        include: {
          user: {
            select: {
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          booking: {
            select: {
              bookingCode: true,
            },
          },
        },
      },
    },
  });

  if (!service) {
    return null;
  }

  // Count all bookings for this service to calculate full metrics
  const totalBookingsCount = await db.booking.count({
    where: { serviceId: id },
  });

  const activeBookingsCount = await db.booking.count({
    where: {
      serviceId: id,
      status: {
        in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS],
      },
    },
  });

  let canDelete = true;
  let deleteRestrictionReason: string | null = null;

  if (activeBookingsCount > 0) {
    canDelete = false;
    deleteRestrictionReason = `Service has ${activeBookingsCount} active booking(s) pending fulfillment. Deactivate instead.`;
  } else if (totalBookingsCount > 0) {
    canDelete = false;
    deleteRestrictionReason = `Service has ${totalBookingsCount} historical booking records. Deactivate instead to preserve student audit history.`;
  }

  const ratings = service.reviews.map((r) => r.rating);
  const totalReviews = ratings.length;
  const averageRating = totalReviews > 0 ? ratings.reduce((a, b) => a + b, 0) / totalReviews : 0;

  return {
    id: service.id,
    name: service.name,
    description: service.description,
    price: service.price,
    durationMinutes: service.durationMinutes,
    capacity: service.capacity,
    location: service.location,
    imageUrl: service.imageUrl,
    isActive: service.isActive,
    categoryId: service.categoryId,
    categoryName: service.category?.name || 'Uncategorized',
    categoryIcon: service.category?.icon || null,
    categorySlug: service.category?.slug || null,
    providerId: service.providerId,
    providerName: service.provider?.name || null,
    providerEmail: service.provider?.email || null,
    totalBookings: totalBookingsCount,
    activeBookings: activeBookingsCount,
    canDelete,
    deleteRestrictionReason,
    createdAt: service.createdAt.toISOString(),
    updatedAt: service.updatedAt.toISOString(),
    recentBookings: service.bookings.map((b) => ({
      id: b.id,
      bookingCode: b.bookingCode,
      studentName: b.student?.name || 'Campus Student',
      studentEmail: b.student?.email || 'student@campus.edu',
      status: b.status,
      amount: b.amount,
      scheduledAt: b.scheduledAt.toISOString(),
      slotTime: b.slotTime,
    })),
    reviewsSummary: {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
    },
    reviews: service.reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      studentName: r.user?.name || 'Verified Student',
      studentEmail: r.user?.email || 'student@campus.edu',
      studentAvatar: r.user?.avatarUrl || null,
      bookingCode: r.booking.bookingCode,
      createdAt: r.createdAt.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    })),
  };
}

/**
 * Creates a new service owned by the authenticated provider.
 */
export async function createService(
  formData: ServiceFormData
): Promise<ActionResponse<{ id: string; name: string }>> {
  try {
    const user = await requireServiceProvider();

    const validated = serviceSchema.safeParse(formData);
    if (!validated.success) {
      const firstError = validated.error.issues[0]?.message || 'Invalid service data';
      return { success: false, error: firstError };
    }

    const {
      name,
      categoryId,
      price,
      durationMinutes,
      capacity,
      location,
      description,
      imageUrl,
      isActive,
    } = validated.data;

    // Verify category exists
    const category = await db.serviceCategory.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      return { success: false, error: 'The selected category does not exist.' };
    }

    const created = await db.service.create({
      data: {
        name,
        categoryId,
        providerId: user.id,
        price,
        durationMinutes,
        capacity,
        location,
        description: description || null,
        imageUrl: imageUrl || null,
        isActive,
      },
      select: {
        id: true,
        name: true,
      },
    });

    revalidatePath('/provider/services');
    revalidatePath('/provider/dashboard');

    return {
      success: true,
      data: {
        id: created.id,
        name: created.name,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create service';
    return { success: false, error: message };
  }
}

/**
 * Updates an existing service owned by the authenticated provider.
 * Strictly verifies provider ownership.
 */
export async function updateService(
  serviceId: string,
  formData: ServiceFormData
): Promise<ActionResponse<{ id: string; name: string }>> {
  try {
    const user = await requireServiceProvider();

    // Verify ownership
    const existing = await db.service.findFirst({
      where: {
        id: serviceId,
        providerId: user.id,
      },
      select: { id: true },
    });

    if (!existing) {
      return {
        success: false,
        error: 'Service not found or you do not have permission to edit it.',
      };
    }

    const validated = serviceSchema.safeParse(formData);
    if (!validated.success) {
      const firstError = validated.error.issues[0]?.message || 'Invalid service data';
      return { success: false, error: firstError };
    }

    const {
      name,
      categoryId,
      price,
      durationMinutes,
      capacity,
      location,
      description,
      imageUrl,
      isActive,
    } = validated.data;

    // Verify category exists
    const category = await db.serviceCategory.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      return { success: false, error: 'The selected category does not exist.' };
    }

    const updated = await db.service.update({
      where: { id: serviceId },
      data: {
        name,
        categoryId,
        price,
        durationMinutes,
        capacity,
        location,
        description: description || null,
        imageUrl: imageUrl || null,
        isActive,
      },
      select: {
        id: true,
        name: true,
      },
    });

    revalidatePath('/provider/services');
    revalidatePath(`/provider/services/${serviceId}`);
    revalidatePath(`/provider/services/${serviceId}/edit`);
    revalidatePath('/provider/dashboard');

    return {
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update service';
    return { success: false, error: message };
  }
}

/**
 * Toggles a service between active and inactive state.
 * Strictly verifies provider ownership.
 */
export async function toggleServiceStatus(
  serviceId: string
): Promise<ActionResponse<{ id: string; isActive: boolean }>> {
  try {
    const user = await requireServiceProvider();

    const existing = await db.service.findFirst({
      where: {
        id: serviceId,
        providerId: user.id,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!existing) {
      return {
        success: false,
        error: 'Service not found or you do not have permission to manage it.',
      };
    }

    const updated = await db.service.update({
      where: { id: serviceId },
      data: {
        isActive: !existing.isActive,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    revalidatePath('/provider/services');
    revalidatePath(`/provider/services/${serviceId}`);
    revalidatePath('/provider/dashboard');

    return {
      success: true,
      data: {
        id: updated.id,
        isActive: updated.isActive,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to toggle service status';
    return { success: false, error: message };
  }
}

/**
 * Deletes a service where allowed.
 * Strictly verifies:
 * 1. Provider ownership (providerId === user.id)
 * 2. No active bookings (PENDING, CONFIRMED, IN_PROGRESS)
 * 3. No historical booking records (preserves audit integrity)
 */
export async function deleteService(
  serviceId: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const user = await requireServiceProvider();

    const service = await db.service.findFirst({
      where: {
        id: serviceId,
        providerId: user.id,
      },
      include: {
        bookings: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!service) {
      return {
        success: false,
        error: 'Service not found or you do not have permission to delete it.',
      };
    }

    // Check for active bookings
    const activeBookings = service.bookings.filter(
      (b) =>
        b.status === BookingStatus.PENDING ||
        b.status === BookingStatus.CONFIRMED ||
        b.status === BookingStatus.IN_PROGRESS
    );

    if (activeBookings.length > 0) {
      return {
        success: false,
        error: `Cannot delete: This service has ${activeBookings.length} active or pending booking(s). Please deactivate the service instead.`,
      };
    }

    // Check for past bookings
    if (service.bookings.length > 0) {
      return {
        success: false,
        error: `Cannot delete: This service has ${service.bookings.length} historical booking record(s). Deactivate the service instead to preserve student records.`,
      };
    }

    await db.service.delete({
      where: { id: serviceId },
    });

    revalidatePath('/provider/services');
    revalidatePath('/provider/dashboard');

    return {
      success: true,
      data: { id: serviceId },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete service';
    return { success: false, error: message };
  }
}

