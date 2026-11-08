'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-role';
import { Role, Prisma } from '@prisma/client';

export interface AdminUserListItem {
  id: string;
  clerkUserId: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: Role | null;
  avatarUrl: string | null;
  createdAt: string;
  formattedJoinedDate: string;
  accountStatus: 'ACTIVE' | 'ONBOARDING_PENDING';
  studentBookingsCount: number;
  providerBookingsCount: number;
  totalBookingsCount: number;
  servicesCount: number;
  reviewsCount: number;
  paymentsCount: number;
}

export interface AdminUsersMetrics {
  totalUsers: number;
  studentsCount: number;
  providersCount: number;
  adminsCount: number;
  unassignedCount: number;
  totalSystemBookings: number;
}

export interface AdminUsersFilterParams {
  searchQuery?: string;
  roleFilter?: 'ALL' | Role | 'UNASSIGNED';
  statusFilter?: 'ALL' | 'ACTIVE' | 'ONBOARDING_PENDING';
  dateFilter?: 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR';
  page?: number;
  pageSize?: number;
}

export interface AdminUsersData {
  users: AdminUserListItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  metrics: AdminUsersMetrics;
  currentAdminId: string;
}

export interface AdminUserDetailActivity {
  id: string;
  clerkUserId: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: Role | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  formattedJoinedDate: string;
  studentBookings: Array<{
    id: string;
    bookingCode: string;
    serviceName: string;
    status: string;
    amount: number;
    scheduledAt: string;
    createdAt: string;
  }>;
  providerServices: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
    isActive: boolean;
    bookingsCount: number;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    serviceName: string;
    createdAt: string;
  }>;
}

export interface AdminUpdateUserInput {
  userId: string;
  name?: string;
  phone?: string | null;
  role?: Role | null;
}

export interface AdminUpdateUserResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    name: string | null;
    phone: string | null;
    role: Role | null;
  };
}

/**
 * Loads paginated users with database-driven search, role filtering, date filtering,
 * and lightweight aggregate booking counts without loading unnecessary records.
 * 
 * STRICT SECURITY:
 * - Only ADMIN users can call this action (enforces requireAdmin()).
 * - Excludes all sensitive authentication data (no tokens, passwords, sessions, or secret keys).
 */
export async function getAdminUsersData(
  params?: AdminUsersFilterParams
): Promise<AdminUsersData> {
  const currentAdmin = await requireAdmin();

  const {
    searchQuery,
    roleFilter = 'ALL',
    statusFilter = 'ALL',
    dateFilter = 'ALL',
    page = 1,
    pageSize = 10,
  } = params || {};

  // Build Prisma where conditions
  const where: Prisma.UserWhereInput = {};

  // 1. Search filter: search by name, email, or phone using database index
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim();
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
    ];
  }

  // 2. Role filter
  if (roleFilter !== 'ALL') {
    if (roleFilter === 'UNASSIGNED') {
      where.role = null;
    } else {
      where.role = roleFilter;
    }
  }

  // 3. Status filter
  if (statusFilter !== 'ALL') {
    if (statusFilter === 'ACTIVE') {
      where.role = { not: null };
    } else if (statusFilter === 'ONBOARDING_PENDING') {
      where.role = null;
    }
  }

  // 4. Date filter
  if (dateFilter !== 'ALL') {
    const now = new Date();
    const start = new Date();
    if (dateFilter === 'TODAY') {
      start.setHours(0, 0, 0, 0);
    } else if (dateFilter === 'WEEK') {
      start.setDate(now.getDate() - 7);
    } else if (dateFilter === 'MONTH') {
      start.setDate(now.getDate() - 30);
    } else if (dateFilter === 'YEAR') {
      start.setFullYear(now.getFullYear() - 1);
    }
    where.createdAt = { gte: start };
  }

  // Pagination parameters
  const take = Math.min(100, Math.max(1, Number(pageSize) || 10));
  const currentPage = Math.max(1, Number(page) || 1);
  const skip = (currentPage - 1) * take;

  // Execute queries in parallel: metrics + total filtered count + paginated records
  const [
    totalUsers,
    studentsCount,
    providersCount,
    adminsCount,
    unassignedCount,
    totalSystemBookings,
    filteredCount,
    rawUsers,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: Role.STUDENT } }),
    db.user.count({ where: { role: Role.SERVICE_PROVIDER } }),
    db.user.count({ where: { role: Role.ADMIN } }),
    db.user.count({ where: { role: null } }),
    db.booking.count(),
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      include: {
        _count: {
          select: {
            bookings: true,
            services: true,
            reviews: true,
            payments: true,
          },
        },
        services: {
          select: {
            _count: {
              select: {
                bookings: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const users: AdminUserListItem[] = rawUsers.map((u) => {
    // Count bookings as student
    const studentBookingsCount = u._count.bookings;

    // Count bookings received across services (if provider) using _count
    const providerBookingsCount = u.services.reduce(
      (sum, s) => sum + s._count.bookings,
      0
    );

    const totalBookingsCount = studentBookingsCount + providerBookingsCount;

    const date = new Date(u.createdAt);
    const formattedJoinedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const accountStatus: 'ACTIVE' | 'ONBOARDING_PENDING' =
      u.role !== null ? 'ACTIVE' : 'ONBOARDING_PENDING';

    const isInternalName = !u.name || u.name.startsWith('user_');
    const cleanName = isInternalName
      ? u.role === 'ADMIN'
        ? 'Campus Administrator'
        : u.role === 'SERVICE_PROVIDER'
        ? 'Campus Provider'
        : 'Campus Student'
      : u.name;
    const isInternalEmail = u.email.startsWith('user_') && u.email.endsWith('@campusserve.edu');
    const cleanEmail = isInternalEmail
      ? u.role === 'ADMIN'
        ? 'admin@campusserve.edu'
        : u.role === 'SERVICE_PROVIDER'
        ? 'provider@campus.edu'
        : 'student@campus.edu'
      : u.email;

    return {
      id: u.id,
      clerkUserId: u.clerkUserId,
      name: cleanName,
      email: cleanEmail,
      phone: u.phone,
      role: u.role,
      avatarUrl: u.avatarUrl,
      createdAt: u.createdAt.toISOString(),
      formattedJoinedDate,
      accountStatus,
      studentBookingsCount,
      providerBookingsCount,
      totalBookingsCount,
      servicesCount: u._count.services,
      reviewsCount: u._count.reviews,
      paymentsCount: u._count.payments,
    };
  });

  const totalPages = Math.max(1, Math.ceil(filteredCount / take));

  const metrics: AdminUsersMetrics = {
    totalUsers,
    studentsCount,
    providersCount,
    adminsCount,
    unassignedCount,
    totalSystemBookings,
  };

  return {
    users,
    totalCount: filteredCount,
    totalPages,
    currentPage,
    pageSize: take,
    metrics,
    currentAdminId: currentAdmin.id,
  };
}

/**
 * Loads detailed activity history for a specific user.
 * Strictly available only to administrators.
 */
export async function getAdminUserDetails(userId: string): Promise<AdminUserDetailActivity | null> {
  await requireAdmin();

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      bookings: {
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          service: { select: { name: true } },
        },
      },
      services: {
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { name: true } },
          _count: { select: { bookings: true } },
        },
      },
      reviews: {
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          service: { select: { name: true } },
        },
      },
    },
  });

  if (!user) return null;

  const date = new Date(user.createdAt);
  const formattedJoinedDate = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const isInternalName = !user.name || user.name.startsWith('user_');
  const cleanName = isInternalName
    ? user.role === 'ADMIN'
      ? 'Campus Administrator'
      : user.role === 'SERVICE_PROVIDER'
      ? 'Campus Provider'
      : 'Campus Student'
    : user.name;
  const isInternalEmail = user.email.startsWith('user_') && user.email.endsWith('@campusserve.edu');
  const cleanEmail = isInternalEmail
    ? user.role === 'ADMIN'
      ? 'admin@campusserve.edu'
      : user.role === 'SERVICE_PROVIDER'
      ? 'provider@campus.edu'
      : 'student@campus.edu'
    : user.email;

  return {
    id: user.id,
    clerkUserId: user.clerkUserId,
    name: cleanName,
    email: cleanEmail,
    phone: user.phone,
    role: user.role,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    formattedJoinedDate,
    studentBookings: user.bookings.map((b) => ({
      id: b.id,
      bookingCode: b.bookingCode,
      serviceName: b.service.name,
      status: b.status,
      amount: b.amount,
      scheduledAt: b.scheduledAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      createdAt: b.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    })),
    providerServices: user.services.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category?.name || 'General',
      price: s.price,
      isActive: s.isActive,
      bookingsCount: s._count.bookings,
    })),
    reviews: user.reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      serviceName: r.service.name,
      createdAt: r.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    })),
  };
}

/**
 * Administrative action: Updates a user's role, name, or phone number.
 * 
 * SAFETY RULES:
 * - Admin cannot demote their own administrator account to prevent accidental lockout.
 * - Enforces role enum validity.
 * - Revalidates all relevant portal paths.
 */
export async function adminUpdateUserAction(
  input: AdminUpdateUserInput
): Promise<AdminUpdateUserResult> {
  try {
    const currentAdmin = await requireAdmin();

    const targetUser = await db.user.findUnique({
      where: { id: input.userId },
    });

    if (!targetUser) {
      return {
        success: false,
        error: 'Target user record not found in database.',
      };
    }

    // Safety guard: Admin cannot demote or strip admin privileges from their own account
    if (targetUser.id === currentAdmin.id && input.role !== undefined && input.role !== Role.ADMIN) {
      return {
        success: false,
        error: 'Safety restriction: You cannot demote or remove admin privileges from your own active account.',
      };
    }

    const updateData: {
      name?: string | null;
      phone?: string | null;
      role?: Role | null;
    } = {};

    if (input.name !== undefined) {
      const trimmedName = input.name.trim();
      if (trimmedName && trimmedName.length < 2) {
        return {
          success: false,
          error: 'User full name must be at least 2 characters.',
        };
      }
      updateData.name = trimmedName || null;
    }

    if (input.phone !== undefined) {
      const trimmedPhone = input.phone?.trim() || null;
      if (trimmedPhone && trimmedPhone.length < 7) {
        return {
          success: false,
          error: 'Phone number must be at least 7 digits.',
        };
      }
      updateData.phone = trimmedPhone;
    }

    if (input.role !== undefined) {
      updateData.role = input.role;
    }

    const updated = await db.user.update({
      where: { id: input.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
      },
    });

    try {
      revalidatePath('/admin/users');
      revalidatePath('/admin/dashboard');
      revalidatePath('/profile');
    } catch {
      // Ignored outside of request context
    }

    return {
      success: true,
      user: updated,
    };
  } catch (error) {
    console.error('[adminUpdateUserAction] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user record.',
    };
  }
}

