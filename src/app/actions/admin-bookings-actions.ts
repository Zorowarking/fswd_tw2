'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-role';
import { BookingStatus, PaymentStatus, PaymentMethod, Role, Prisma } from '@prisma/client';

export interface AdminBookingPaymentItem {
  id: string;
  paymentCode: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  transactionId: string | null;
  orderId: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface AdminBookingListItem {
  id: string;
  bookingCode: string;
  status: BookingStatus;
  amount: number;
  scheduledAt: string;
  formattedScheduledDate: string;
  slotTime: string | null;
  location: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
  student: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
  } | null;
  service: {
    id: string;
    name: string;
    price: number;
    durationMinutes: number;
    location: string | null;
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
  };
  latestPayment: AdminBookingPaymentItem | null;
  paymentStatus: PaymentStatus;
  review: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
  } | null;
}

export interface AdminBookingsMetrics {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  successfulPaymentsCount: number;
  pendingPaymentsCount: number;
  refundedPaymentsCount: number;
}

export interface AdminFilterOption {
  id: string;
  name: string;
  email: string;
}

export interface AdminBookingsFilterParams {
  searchQuery?: string;
  statusFilter?: 'ALL' | BookingStatus;
  dateFilter?: 'ALL' | 'TODAY' | 'UPCOMING' | 'PAST' | '7D' | '30D' | 'CUSTOM';
  startDate?: string;
  endDate?: string;
  providerFilter?: string;
  studentFilter?: string;
  paymentStatusFilter?: 'ALL' | PaymentStatus;
  sortField?: 'createdAt' | 'scheduledAt' | 'amount';
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface AdminBookingsData {
  bookings: AdminBookingListItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  metrics: AdminBookingsMetrics;
  providers: AdminFilterOption[];
  students: AdminFilterOption[];
}

export interface AdminBookingDetailData extends AdminBookingListItem {
  allPayments: AdminBookingPaymentItem[];
}

export interface AdminUpdateBookingStatusResult {
  success: boolean;
  error?: string;
  booking?: {
    id: string;
    bookingCode: string;
    status: BookingStatus;
    updatedAt: string;
  };
}

/**
 * Loads all university campus bookings across all services, providers, and students.
 * Includes complete relational records, payment transactions, and audit timestamps.
 * 
 * STRICT ACCESS CONTROL: Only Role.ADMIN permitted.
 */
/**
 * Loads paginated university campus bookings with database-driven search, status filtering,
 * provider/student filtering, date filtering, and complete transactional aggregates.
 * 
 * STRICT ACCESS CONTROL: Only Role.ADMIN permitted.
 */
export async function getAdminBookingsData(
  params?: AdminBookingsFilterParams
): Promise<AdminBookingsData> {
  await requireAdmin();

  const {
    searchQuery,
    statusFilter = 'ALL',
    dateFilter = 'ALL',
    startDate,
    endDate,
    providerFilter = 'ALL',
    studentFilter = 'ALL',
    paymentStatusFilter = 'ALL',
    sortField = 'createdAt',
    sortDirection = 'desc',
    page = 1,
    pageSize = 10,
  } = params || {};

  // Build Prisma where conditions
  const where: Prisma.BookingWhereInput = {};

  // 1. Search filter: bookingCode, student name/email, service name
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim();
    where.OR = [
      { bookingCode: { contains: q, mode: 'insensitive' } },
      { student: { name: { contains: q, mode: 'insensitive' } } },
      { student: { email: { contains: q, mode: 'insensitive' } } },
      { service: { name: { contains: q, mode: 'insensitive' } } },
      { service: { provider: { name: { contains: q, mode: 'insensitive' } } } },
    ];
  }

  // 2. Status filter
  if (statusFilter !== 'ALL') {
    where.status = statusFilter;
  }

  // 3. Provider filter
  if (providerFilter !== 'ALL') {
    where.service = { providerId: providerFilter };
  }

  // 4. Student filter
  if (studentFilter !== 'ALL') {
    where.studentId = studentFilter;
  }

  // 5. Payment status filter
  if (paymentStatusFilter !== 'ALL') {
    where.payments = {
      some: {
        status: paymentStatusFilter,
      },
    };
  }

  // 6. Date filtering (scheduledAt or createdAt)
  if (dateFilter !== 'ALL') {
    const now = new Date();
    if (dateFilter === 'TODAY') {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      where.scheduledAt = { gte: startOfDay, lte: endOfDay };
    } else if (dateFilter === 'UPCOMING') {
      where.scheduledAt = { gte: now };
    } else if (dateFilter === 'PAST') {
      where.scheduledAt = { lt: now };
    } else if (dateFilter === '7D') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      where.scheduledAt = { gte: start };
    } else if (dateFilter === '30D') {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      where.scheduledAt = { gte: start };
    } else if (dateFilter === 'CUSTOM' && (startDate || endDate)) {
      where.scheduledAt = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      };
    }
  }

  // Sorting
  const orderBy: Prisma.BookingOrderByWithRelationInput = {
    [sortField]: sortDirection,
  };

  // Pagination parameters
  const take = Math.min(100, Math.max(1, Number(pageSize) || 10));
  const currentPage = Math.max(1, Number(page) || 1);
  const skip = (currentPage - 1) * take;

  // Execute database queries in parallel
  const [
    totalBookings,
    pendingBookings,
    confirmedBookings,
    completedBookings,
    cancelledBookings,
    revenueAgg,
    successfulPaymentsCount,
    pendingPaymentsCount,
    refundedPaymentsCount,
    filteredCount,
    rawProviders,
    rawStudents,
    rawBookings,
  ] = await Promise.all([
    db.booking.count(),
    db.booking.count({ where: { status: BookingStatus.PENDING } }),
    db.booking.count({ where: { status: BookingStatus.CONFIRMED } }),
    db.booking.count({ where: { status: BookingStatus.COMPLETED } }),
    db.booking.count({ where: { status: BookingStatus.CANCELLED } }),
    db.payment.aggregate({
      where: { status: PaymentStatus.SUCCESSFUL },
      _sum: { amount: true },
    }),
    db.payment.count({ where: { status: PaymentStatus.SUCCESSFUL } }),
    db.payment.count({ where: { status: PaymentStatus.PENDING } }),
    db.payment.count({ where: { status: PaymentStatus.REFUNDED } }),
    db.booking.count({ where }),
    db.user.findMany({
      where: {
        OR: [{ role: Role.SERVICE_PROVIDER }, { services: { some: {} } }],
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    }),
    db.user.findMany({
      where: {
        OR: [{ role: Role.STUDENT }, { bookings: { some: {} } }],
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    }),
    db.booking.findMany({
      where,
      orderBy,
      take,
      skip,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            durationMinutes: true,
            location: true,
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
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            paymentCode: true,
            amount: true,
            currency: true,
            status: true,
            method: true,
            transactionId: true,
            orderId: true,
            paidAt: true,
            createdAt: true,
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
    }),
  ]);

  const dateOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };

  const auditDateTimeOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  const bookings: AdminBookingListItem[] = rawBookings.map((b) => {
    const latestPaymentRaw = b.payments[0] || null;
    let paymentStatus: PaymentStatus = PaymentStatus.PENDING;

    if (b.amount === 0) {
      paymentStatus = PaymentStatus.SUCCESSFUL; // Free university amenity
    } else if (latestPaymentRaw) {
      paymentStatus = latestPaymentRaw.status;
    }

    const latestPayment: AdminBookingPaymentItem | null = latestPaymentRaw
      ? {
          id: latestPaymentRaw.id,
          paymentCode: latestPaymentRaw.paymentCode,
          amount: latestPaymentRaw.amount,
          currency: latestPaymentRaw.currency,
          status: latestPaymentRaw.status,
          method: latestPaymentRaw.method,
          transactionId: latestPaymentRaw.transactionId,
          orderId: latestPaymentRaw.orderId,
          paidAt: latestPaymentRaw.paidAt?.toISOString() || null,
          createdAt: latestPaymentRaw.createdAt.toISOString(),
        }
      : null;

    return {
      id: b.id,
      bookingCode: b.bookingCode,
      status: b.status,
      amount: b.amount,
      scheduledAt: b.scheduledAt.toISOString(),
      formattedScheduledDate: b.scheduledAt.toLocaleDateString('en-US', dateOptions),
      slotTime: b.slotTime,
      location: b.location || b.service.location,
      notes: b.notes,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
      formattedCreatedAt: b.createdAt.toLocaleString('en-US', auditDateTimeOptions),
      formattedUpdatedAt: b.updatedAt.toLocaleString('en-US', auditDateTimeOptions),
      student: b.student,
      service: b.service,
      latestPayment,
      paymentStatus,
      review: b.review
        ? {
            id: b.review.id,
            rating: b.review.rating,
            comment: b.review.comment,
            createdAt: b.review.createdAt.toISOString(),
          }
        : null,
    };
  });

  const totalPages = Math.max(1, Math.ceil(filteredCount / take));

  const metrics: AdminBookingsMetrics = {
    totalBookings,
    pendingBookings,
    confirmedBookings,
    completedBookings,
    cancelledBookings,
    totalRevenue: revenueAgg._sum.amount ?? 0,
    successfulPaymentsCount,
    pendingPaymentsCount,
    refundedPaymentsCount,
  };

  const providers: AdminFilterOption[] = rawProviders.map((p) => ({
    id: p.id,
    name: p.name || p.email,
    email: p.email,
  }));

  const students: AdminFilterOption[] = rawStudents.map((s) => ({
    id: s.id,
    name: s.name || s.email,
    email: s.email,
  }));

  return {
    bookings,
    totalCount: filteredCount,
    totalPages,
    currentPage,
    pageSize: take,
    metrics,
    providers,
    students,
  };
}

/**
 * Loads comprehensive inspection details for a single booking work order.
 */
export async function getAdminBookingDetails(
  bookingId: string
): Promise<AdminBookingDetailData | null> {
  await requireAdmin();

  const b = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatarUrl: true,
        },
      },
      service: {
        select: {
          id: true,
          name: true,
          price: true,
          durationMinutes: true,
          location: true,
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
        },
      },
      payments: {
        orderBy: { createdAt: 'desc' },
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

  if (!b) return null;

  const dateOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };

  const auditDateTimeOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  const allPayments: AdminBookingPaymentItem[] = b.payments.map((p) => ({
    id: p.id,
    paymentCode: p.paymentCode,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    method: p.method,
    transactionId: p.transactionId,
    orderId: p.orderId,
    paidAt: p.paidAt?.toISOString() || null,
    createdAt: p.createdAt.toISOString(),
  }));

  const latestPayment = allPayments[0] || null;
  const paymentStatus = b.amount === 0 ? PaymentStatus.SUCCESSFUL : (latestPayment?.status || PaymentStatus.PENDING);

  return {
    id: b.id,
    bookingCode: b.bookingCode,
    status: b.status,
    amount: b.amount,
    scheduledAt: b.scheduledAt.toISOString(),
    formattedScheduledDate: b.scheduledAt.toLocaleDateString('en-US', dateOptions),
    slotTime: b.slotTime,
    location: b.location || b.service.location,
    notes: b.notes,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    formattedCreatedAt: b.createdAt.toLocaleString('en-US', auditDateTimeOptions),
    formattedUpdatedAt: b.updatedAt.toLocaleString('en-US', auditDateTimeOptions),
    student: b.student,
    service: b.service,
    latestPayment,
    paymentStatus,
    review: b.review
      ? {
          id: b.review.id,
          rating: b.review.rating,
          comment: b.review.comment,
          createdAt: b.review.createdAt.toISOString(),
        }
      : null,
    allPayments,
  };
}

/**
 * Administrative action: Updates a booking's status (e.g. approve, mark completed, cancel).
 */
export async function adminUpdateBookingStatusAction(
  bookingId: string,
  newStatus: BookingStatus
): Promise<AdminUpdateBookingStatusResult> {
  try {
    await requireAdmin();

    const updated = await db.booking.update({
      where: { id: bookingId },
      data: { status: newStatus },
      select: {
        id: true,
        bookingCode: true,
        status: true,
        updatedAt: true,
      },
    });

    try {
      revalidatePath('/admin/bookings');
      revalidatePath('/admin/dashboard');
      revalidatePath('/student/bookings');
      revalidatePath('/provider/bookings');
    } catch {
      // Ignored outside of request context
    }

    return {
      success: true,
      booking: {
        id: updated.id,
        bookingCode: updated.bookingCode,
        status: updated.status,
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('[adminUpdateBookingStatusAction] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update booking status.',
    };
  }
}

