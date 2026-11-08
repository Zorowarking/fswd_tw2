'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireServiceProvider } from '@/lib/auth-role';
import { BookingStatus, PaymentStatus, NotificationType } from '@prisma/client';

export type ProviderPaymentStatus =
  | 'SUCCESSFUL'
  | 'PENDING'
  | 'FAILED'
  | 'REFUNDED'
  | 'FREE_PASS';

export interface ProviderBookingItem {
  id: string;
  bookingCode: string;
  status: BookingStatus;
  amount: number;
  scheduledAt: string; // ISO string
  formattedDate: string;
  slotTime: string;
  location: string;
  notes: string | null;
  createdAt: string;
  formattedCreatedAt: string;

  student: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    role: string;
  };

  service: {
    id: string;
    name: string;
    durationMinutes: number;
    price: number;
    location: string | null;
    categoryName: string;
    categorySlug: string | null;
  };

  payment: {
    id: string | null;
    status: ProviderPaymentStatus;
    method: string | null;
    transactionId: string | null;
    orderId: string | null;
    paidAt: string | null;
    amount: number;
  };

  review: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
  } | null;

  // Allowed actions based on business state transitions
  canAccept: boolean;
  canReject: boolean;
  canStart: boolean;
  canComplete: boolean;
}

export interface ProviderBookingsSummary {
  bookings: ProviderBookingItem[];
  metrics: {
    total: number;
    pending: number;
    confirmed: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    revenue: number;
  };
  services: Array<{
    id: string;
    name: string;
  }>;
}

/**
 * Retrieves all booking requests associated strictly with services belonging to the authenticated provider.
 *
 * STRICT AUTHORIZATION:
 * Providers can ONLY access bookings where service.providerId === authenticated provider's ID.
 */
export async function getProviderBookingsAction(): Promise<ProviderBookingsSummary> {
  const provider = await requireServiceProvider();

  // 1. Fetch provider's owned services list for filter options
  const ownedServices = await db.service.findMany({
    where: { providerId: provider.id },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  // 2. Fetch bookings strictly scoped to services belonging to this provider
  const rawBookings = await db.booking.findMany({
    where: {
      service: {
        providerId: provider.id, // Strictly scoped
      },
    },
    orderBy: {
      scheduledAt: 'desc',
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatarUrl: true,
          role: true,
        },
      },
      service: {
        select: {
          id: true,
          name: true,
          durationMinutes: true,
          price: true,
          location: true,
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      },
      payments: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      review: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
      },
    },
  });

  const formattedBookings: ProviderBookingItem[] = rawBookings.map((b) => {
    // Resolve payment status
    const successfulPayment = b.payments.find((p) => p.status === PaymentStatus.SUCCESSFUL);
    const pendingPayment = b.payments.find((p) => p.status === PaymentStatus.PENDING);
    const failedPayment = b.payments.find((p) => p.status === PaymentStatus.FAILED);
    const refundedPayment = b.payments.find((p) => p.status === PaymentStatus.REFUNDED);

    let paymentDisplayStatus: ProviderPaymentStatus = 'PENDING';
    const primaryPayment = successfulPayment || pendingPayment || failedPayment || refundedPayment || b.payments[0];

    if (b.amount === 0) {
      paymentDisplayStatus = 'FREE_PASS';
    } else if (successfulPayment) {
      paymentDisplayStatus = 'SUCCESSFUL';
    } else if (refundedPayment) {
      paymentDisplayStatus = 'REFUNDED';
    } else if (failedPayment) {
      paymentDisplayStatus = 'FAILED';
    } else {
      paymentDisplayStatus = 'PENDING';
    }

    // Determine allowed actions
    const canAccept = b.status === BookingStatus.PENDING;
    const canReject = b.status === BookingStatus.PENDING || b.status === BookingStatus.CONFIRMED;
    const canStart = b.status === BookingStatus.CONFIRMED;
    const canComplete = b.status === BookingStatus.IN_PROGRESS;

    return {
      id: b.id,
      bookingCode: b.bookingCode,
      status: b.status,
      amount: b.amount,
      scheduledAt: b.scheduledAt.toISOString(),
      formattedDate: b.scheduledAt.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      slotTime: b.slotTime || 'Standard Slot',
      location: b.location || b.service.location || 'Campus Facilities Desk',
      notes: b.notes,
      createdAt: b.createdAt.toISOString(),
      formattedCreatedAt: b.createdAt.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      student: {
        id: b.student?.id || b.studentId || '',
        name: b.student?.name || 'Campus Student',
        email: b.student?.email || 'student@campus.edu',
        phone: b.student?.phone || null,
        avatarUrl: b.student?.avatarUrl || null,
        role: b.student?.role || 'STUDENT',
      },
      service: {
        id: b.service.id,
        name: b.service.name,
        durationMinutes: b.service.durationMinutes,
        price: Number(b.service.price),
        location: b.service.location,
        categoryName: b.service.category?.name || 'General Campus Service',
        categorySlug: b.service.category?.slug || null,
      },
      payment: {
        id: primaryPayment?.id || null,
        status: paymentDisplayStatus,
        method: primaryPayment?.method || (b.amount === 0 ? 'Campus Grant' : null),
        transactionId: primaryPayment?.transactionId || null,
        orderId: primaryPayment?.orderId || null,
        paidAt: primaryPayment?.paidAt ? primaryPayment.paidAt.toISOString() : null,
        amount: primaryPayment ? Number(primaryPayment.amount) : b.amount,
      },
      review: b.review
        ? {
            id: b.review.id,
            rating: b.review.rating,
            comment: b.review.comment,
            createdAt: b.review.createdAt.toISOString(),
          }
        : null,
      canAccept,
      canReject,
      canStart,
      canComplete,
    };
  });

  // Calculate metrics
  const pending = formattedBookings.filter((b) => b.status === BookingStatus.PENDING).length;
  const confirmed = formattedBookings.filter((b) => b.status === BookingStatus.CONFIRMED).length;
  const inProgress = formattedBookings.filter((b) => b.status === BookingStatus.IN_PROGRESS).length;
  const completed = formattedBookings.filter((b) => b.status === BookingStatus.COMPLETED).length;
  const cancelled = formattedBookings.filter(
    (b) => b.status === BookingStatus.CANCELLED || b.status === BookingStatus.REJECTED
  ).length;

  const revenue = formattedBookings
    .filter((b) => b.payment.status === 'SUCCESSFUL')
    .reduce((acc, curr) => acc + curr.amount, 0);

  return {
    bookings: formattedBookings,
    metrics: {
      total: formattedBookings.length,
      pending,
      confirmed,
      inProgress,
      completed,
      cancelled,
      revenue,
    },
    services: ownedServices,
  };
}

/**
 * Action: Accept Booking Request
 * Transitions PENDING -> CONFIRMED.
 *
 * STRICT AUTHORIZATION:
 * Verifies that the booking belongs strictly to a service owned by the authenticated provider.
 */
export async function acceptBookingAction(bookingId: string) {
  try {
    const provider = await requireServiceProvider();

    if (!bookingId) {
      return { success: false, error: 'Booking ID is required.' };
    }

    const booking = await db.booking.findFirst({
      where: {
        id: bookingId,
        service: {
          providerId: provider.id, // Strictly scoped to provider
        },
      },
      include: {
        service: true,
      },
    });

    if (!booking) {
      return {
        success: false,
        error: 'Booking not found or you are not authorized to manage this booking.',
      };
    }

    if (booking.status !== BookingStatus.PENDING) {
      return {
        success: false,
        error: `Cannot accept booking with current status "${booking.status}". Only PENDING bookings can be accepted.`,
      };
    }

    await db.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.CONFIRMED,
      },
    });

    // Notify Student: Booking Confirmed
    if (booking.studentId) {
      await db.notification.create({
        data: {
          userId: booking.studentId,
          type: NotificationType.BOOKING_CONFIRMED,
          title: 'Booking Confirmed',
          message: `Your reservation for "${booking.service.name}" (${booking.bookingCode}) has been confirmed by the provider.`,
          link: `/student/bookings/${booking.id}`,
        },
      });
    }

    revalidatePath('/provider/bookings');
    revalidatePath('/provider/dashboard');
    revalidatePath('/student/bookings');
    revalidatePath(`/student/bookings/${booking.id}`);

    return {
      success: true,
      message: `Reservation token ${booking.bookingCode} confirmed successfully.`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to accept booking.';
    return { success: false, error: message };
  }
}

/**
 * Action: Reject Booking Request
 * Transitions PENDING / CONFIRMED -> REJECTED.
 *
 * STRICT AUTHORIZATION:
 * Verifies that the booking belongs strictly to a service owned by the authenticated provider.
 */
export async function rejectBookingAction(bookingId: string, reason?: string) {
  try {
    const provider = await requireServiceProvider();

    if (!bookingId) {
      return { success: false, error: 'Booking ID is required.' };
    }

    const booking = await db.booking.findFirst({
      where: {
        id: bookingId,
        service: {
          providerId: provider.id, // Strictly scoped to provider
        },
      },
      include: {
        service: true,
      },
    });

    if (!booking) {
      return {
        success: false,
        error: 'Booking not found or you are not authorized to manage this booking.',
      };
    }

    if (booking.status === BookingStatus.COMPLETED) {
      return {
        success: false,
        error: 'Cannot reject an already completed booking session.',
      };
    }

    if (booking.status === BookingStatus.REJECTED || booking.status === BookingStatus.CANCELLED) {
      return {
        success: false,
        error: 'This booking is already cancelled or rejected.',
      };
    }

    const updatedNotes = reason?.trim()
      ? `${booking.notes ? booking.notes + ' | ' : ''}Rejected by provider: ${reason.trim()}`
      : booking.notes;

    await db.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.REJECTED,
        notes: updatedNotes,
      },
    });

    // Notify Student: Booking Rejected
    if (booking.studentId) {
      await db.notification.create({
        data: {
          userId: booking.studentId,
          type: NotificationType.BOOKING_REJECTED,
          title: 'Booking Request Declined',
          message: `Your booking for "${booking.service.name}" (${booking.bookingCode}) was declined by the provider.${reason?.trim() ? ` Reason: ${reason.trim()}` : ''}`,
          link: `/student/bookings/${booking.id}`,
        },
      });
    }

    revalidatePath('/provider/bookings');
    revalidatePath('/provider/dashboard');
    revalidatePath('/student/bookings');
    revalidatePath(`/student/bookings/${booking.id}`);

    return {
      success: true,
      message: `Reservation token ${booking.bookingCode} declined. Time slot has been released.`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to reject booking.';
    return { success: false, error: message };
  }
}

/**
 * Action: Start Service
 * Transitions CONFIRMED -> IN_PROGRESS.
 *
 * STRICT AUTHORIZATION:
 * Verifies that the booking belongs strictly to a service owned by the authenticated provider.
 */
export async function startServiceBookingAction(bookingId: string) {
  try {
    const provider = await requireServiceProvider();

    if (!bookingId) {
      return { success: false, error: 'Booking ID is required.' };
    }

    const booking = await db.booking.findFirst({
      where: {
        id: bookingId,
        service: {
          providerId: provider.id, // Strictly scoped to provider
        },
      },
      include: {
        service: true,
      },
    });

    if (!booking) {
      return {
        success: false,
        error: 'Booking not found or you are not authorized to manage this booking.',
      };
    }

    if (booking.status !== BookingStatus.CONFIRMED && booking.status !== BookingStatus.PENDING) {
      return {
        success: false,
        error: `Cannot start service for booking in "${booking.status}" status.`,
      };
    }

    await db.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.IN_PROGRESS,
      },
    });

    revalidatePath('/provider/bookings');
    revalidatePath('/provider/dashboard');
    revalidatePath('/student/bookings');
    revalidatePath(`/student/bookings/${booking.id}`);

    return {
      success: true,
      message: `Service session started for token ${booking.bookingCode}. Marked as In Progress.`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to start service session.';
    return { success: false, error: message };
  }
}

/**
 * Action: Mark Completed
 * Transitions IN_PROGRESS / CONFIRMED -> COMPLETED.
 *
 * STRICT AUTHORIZATION:
 * Verifies that the booking belongs strictly to a service owned by the authenticated provider.
 */
export async function completeServiceBookingAction(bookingId: string, notes?: string) {
  try {
    const provider = await requireServiceProvider();

    if (!bookingId) {
      return { success: false, error: 'Booking ID is required.' };
    }

    const booking = await db.booking.findFirst({
      where: {
        id: bookingId,
        service: {
          providerId: provider.id, // Strictly scoped to provider
        },
      },
      include: {
        service: true,
      },
    });

    if (!booking) {
      return {
        success: false,
        error: 'Booking not found or you are not authorized to manage this booking.',
      };
    }

    if (booking.status === BookingStatus.COMPLETED) {
      return {
        success: false,
        error: 'This booking is already marked as completed.',
      };
    }

    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.REJECTED) {
      return {
        success: false,
        error: 'Cannot complete a cancelled or rejected booking.',
      };
    }

    const updatedNotes = notes?.trim()
      ? `${booking.notes ? booking.notes + ' | ' : ''}Completion note: ${notes.trim()}`
      : booking.notes;

    await db.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.COMPLETED,
        notes: updatedNotes,
      },
    });

    // Notify Student: Booking Completed
    if (booking.studentId) {
      await db.notification.create({
        data: {
          userId: booking.studentId,
          type: NotificationType.BOOKING_COMPLETED,
          title: 'Service Session Completed',
          message: `Your booking for "${booking.service.name}" (${booking.bookingCode}) has been completed. Leave a review to share your feedback!`,
          link: `/student/bookings/${booking.id}`,
        },
      });
    }

    revalidatePath('/provider/bookings');
    revalidatePath('/provider/dashboard');
    revalidatePath('/student/bookings');
    revalidatePath(`/student/bookings/${booking.id}`);

    return {
      success: true,
      message: `Reservation token ${booking.bookingCode} marked as COMPLETED. Student review unlocked.`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to complete booking.';
    return { success: false, error: message };
  }
}

