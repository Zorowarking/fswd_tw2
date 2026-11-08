'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireStudent } from '@/lib/auth-role';
import { BookingStatus, DayOfWeek, PaymentStatus, NotificationType, Role } from '@prisma/client';
import {
  evaluateCancellationEligibility,
  type CancellationEligibilityResult,
  type CancellationRefundPolicy,
} from '@/lib/booking-cancellation';

export interface CreateBookingPayload {
  serviceId: string;
  scheduledAt: string; // "YYYY-MM-DD"
  slotTime: string; // e.g., "09:00 AM - 09:30 AM"
  notes?: string;
  status?: BookingStatus;
  // NOTE: Notice no price or amount field here! The amount is calculated strictly server-side.
}

export interface StudentUserInfo {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
}

export interface ProviderUserInfo {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export interface ServiceSummaryInfo {
  id: string;
  name: string;
  categoryName: string;
  durationMinutes: number;
  location: string | null;
  price: number;
}

export interface BookingResponseData {
  id: string;
  bookingCode: string;
  status: BookingStatus;
  amount: number;
  scheduledAt: string;
  slotTime: string;
  location: string;
  notes: string | null;
  createdAt: string;
  student: StudentUserInfo;
  provider: ProviderUserInfo;
  service: ServiceSummaryInfo;
}

export interface CreateBookingResult {
  success: boolean;
  error?: string;
  booking?: BookingResponseData;
}

/**
 * Helper to parse time strings like "09:00", "09:00 AM", "02:30 PM" into minutes from midnight (0-1439).
 */
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const cleaned = timeStr.trim();
  const isPM = /pm/i.test(cleaned);
  const isAM = /am/i.test(cleaned);
  const numericParts = cleaned.replace(/[^\d:]/g, '').split(':').map(Number);
  let h = numericParts[0] || 0;
  const m = numericParts[1] || 0;

  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;

  return h * 60 + m;
}

/**
 * Helper to format minutes from midnight to "HH:MM AM/PM"
 */
function formatMinutesToTime(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

/**
 * Generates theoretical valid time slots for a day given operating hours and duration.
 */
function generateValidSlotsForDay(startTime: string, endTime: string, durationMinutes: number): string[] {
  const startMin = parseTimeToMinutes(startTime);
  const endMin = parseTimeToMinutes(endTime);
  const slotDuration = durationMinutes > 0 ? durationMinutes : 30;

  const validSlots: string[] = [];
  let currentMin = startMin;

  while (currentMin + slotDuration <= endMin) {
    const fromStr = formatMinutesToTime(currentMin);
    const toStr = formatMinutesToTime(currentMin + slotDuration);
    validSlots.push(`${fromStr} - ${toStr}`);
    currentMin += slotDuration;
  }

  return validSlots;
}

/**
 * Generates an authentic unique booking code: CS-XXXXXX
 */
async function generateUniqueBookingCode(): Promise<string> {
  let isUnique = false;
  let code = '';
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    attempts++;
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    code = `CS-${randomNum}`;
    const existing = await db.booking.findUnique({
      where: { bookingCode: code },
      select: { id: true },
    });
    if (!existing) {
      isUnique = true;
    }
  }

  if (!isUnique) {
    code = `CS-${Date.now().toString().slice(-6)}`;
  }

  return code;
}

/**
 * Creates a verified booking for a student with complete server-side validation.
 *
 * Enforces:
 * 1. User authentication and Student role verification
 * 2. Service existence verification
 * 3. Service active status verification
 * 4. Slot existence verification (valid operating hours and step intervals)
 * 5. Availability verification (no full-day blocks, no partial maintenance overlap, not in past)
 * 6. Conflict prevention (atomic concurrent slot capacity limit & student double-booking prevention)
 * 7. Server-side price calculation (client price values are NEVER accepted)
 */
export async function createBooking(payload: CreateBookingPayload): Promise<CreateBookingResult> {
  try {
    // 1. VERIFY USER ROLE
    const studentUser = await requireStudent();

    // Validate date format strictly: YYYY-MM-DD
    const rawDatePart = payload.scheduledAt.includes('T')
      ? payload.scheduledAt.split('T')[0]
      : payload.scheduledAt.trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDatePart)) {
      return { success: false, error: 'Invalid scheduled date format. Expected YYYY-MM-DD.' };
    }

    if (!payload.slotTime || !payload.slotTime.includes('-')) {
      return { success: false, error: 'Invalid time slot format.' };
    }

    const bookingDateUtc = new Date(`${rawDatePart}T00:00:00.000Z`);
    if (isNaN(bookingDateUtc.getTime())) {
      return { success: false, error: 'Invalid scheduled date provided.' };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (rawDatePart < todayStr) {
      return { success: false, error: 'Cannot book slots in the past.' };
    }

    // Execute atomic transaction for multi-layered server-side verification
    const bookingRecord = await db.$transaction(async (tx) => {
      // 2. VERIFY SERVICE EXISTS
      const service = await tx.service.findUnique({
        where: { id: payload.serviceId },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          provider: { select: { id: true, name: true, email: true, phone: true } },
          availabilities: { where: { isActive: true } },
          blockedPeriods: true,
        },
      });

      if (!service) {
        throw new Error('The requested campus service does not exist.');
      }

      // 3. VERIFY SERVICE IS ACTIVE
      if (!service.isActive) {
        throw new Error(
          'This campus service is currently inactive and not accepting reservations.'
        );
      }

      // 4. VERIFY SLOT EXISTS IN SERVICE OPERATING SCHEDULE
      const daysMap: DayOfWeek[] = [
        DayOfWeek.SUNDAY,
        DayOfWeek.MONDAY,
        DayOfWeek.TUESDAY,
        DayOfWeek.WEDNESDAY,
        DayOfWeek.THURSDAY,
        DayOfWeek.FRIDAY,
        DayOfWeek.SATURDAY,
      ];
      const dayOfWeekName = daysMap[bookingDateUtc.getUTCDay()];
      const dayAvail = service.availabilities.find((a) => a.dayOfWeek === dayOfWeekName);

      // Check day open/closed status
      if (dayAvail && !dayAvail.isActive) {
        throw new Error(`The service is not active on ${dayOfWeekName.toLowerCase()}s.`);
      }
      if (!dayAvail && dayOfWeekName === DayOfWeek.SUNDAY) {
        throw new Error('This service is closed on Sundays.');
      }

      // Determine operating hours and slot duration for this day
      const startTime = dayAvail?.startTime || '09:00';
      const endTime = dayAvail?.endTime || '18:00';
      const slotDuration = dayAvail?.slotDuration || service.durationMinutes || 30;
      const slotCapacity = dayAvail?.maxBookingsPerSlot || service.capacity || 1;

      // Compute all legitimate slot windows for this day
      const validSlots = generateValidSlotsForDay(startTime, endTime, slotDuration);
      if (!validSlots.includes(payload.slotTime.trim())) {
        throw new Error(
          `The requested slot "${payload.slotTime}" does not exist in the service schedule for ${dayOfWeekName}.`
        );
      }

      // 5. VERIFY AVAILABILITY
      // A. Check full-day blocked dates
      const isFullDayBlocked = service.blockedPeriods.some((bp) => {
        if (!bp.isFullDay) return false;
        const startStr = bp.startDate.toISOString().split('T')[0];
        const endStr = bp.endDate.toISOString().split('T')[0];
        return rawDatePart >= startStr && rawDatePart <= endStr;
      });

      if (isFullDayBlocked) {
        throw new Error(
          'The service provider has blocked this entire date from accepting bookings.'
        );
      }

      // B. Check partial-day unavailable windows / maintenance
      const slotParts = payload.slotTime.split('-').map((s) => s.trim());
      const slotStartMin = parseTimeToMinutes(slotParts[0] || '');
      const slotEndMin = parseTimeToMinutes(slotParts[1] || '');

      const isSlotInMaintenance = service.blockedPeriods.some((bp) => {
        if (bp.isFullDay) return false;
        const startStr = bp.startDate.toISOString().split('T')[0];
        const endStr = bp.endDate.toISOString().split('T')[0];
        if (rawDatePart < startStr || rawDatePart > endStr) return false;
        if (!bp.startTime || !bp.endTime) return false;

        const bStart = parseTimeToMinutes(bp.startTime);
        const bEnd = parseTimeToMinutes(bp.endTime);
        // Overlap: slot start < block end AND slot end > block start
        return slotStartMin < bEnd && slotEndMin > bStart;
      });

      if (isSlotInMaintenance) {
        throw new Error(
          'The selected time slot overlaps with a scheduled provider maintenance or unavailable period.'
        );
      }

      // C. Verify slot has not elapsed if booking for today (+5 min grace buffer)
      if (rawDatePart === todayStr) {
        const now = new Date();
        const currentMin = now.getHours() * 60 + now.getMinutes();
        if (slotStartMin <= currentMin + 5) {
          throw new Error('This time slot has already passed for today. Please choose an upcoming slot.');
        }
      }

      // 6. PREVENT CONFLICTING BOOKINGS
      // A. Concurrency capacity check on the slot
      const startOfDay = new Date(`${rawDatePart}T00:00:00.000Z`);
      const endOfDay = new Date(`${rawDatePart}T23:59:59.999Z`);

      const concurrentActiveBookings = await tx.booking.count({
        where: {
          serviceId: service.id,
          scheduledAt: { gte: startOfDay, lte: endOfDay },
          slotTime: payload.slotTime.trim(),
          status: {
            in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS],
          },
        },
      });

      if (concurrentActiveBookings >= slotCapacity) {
        throw new Error(
          `This time slot is no longer available. Maximum capacity of ${slotCapacity} concurrent student reservation${
            slotCapacity > 1 ? 's' : ''
          } has been reached.`
        );
      }

      // B. Conflict check for the same student (prevent double-booking across services or same service)
      const studentConflictingBooking = await tx.booking.findFirst({
        where: {
          studentId: studentUser.id,
          scheduledAt: { gte: startOfDay, lte: endOfDay },
          slotTime: payload.slotTime.trim(),
          status: {
            in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS],
          },
        },
        include: {
          service: { select: { id: true, name: true } },
        },
      });

      if (studentConflictingBooking) {
        if (studentConflictingBooking.serviceId === service.id) {
          throw new Error(
            'You already have a confirmed reservation for this service at this exact time slot.'
          );
        } else {
          throw new Error(
            `Schedule Conflict: You already have an active booking for "${studentConflictingBooking.service.name}" at this exact date and time.`
          );
        }
      }

      // 7. CALCULATE AMOUNT SERVER-SIDE (NEVER TRUST CLIENT PRICE VALUES)
      const serverCalculatedAmount = Number(service.price) >= 0 ? Number(service.price) : 0;

      // 8. ENFORCE STATUS SERVER-SIDE (PREVENT BOOKING STATUS MANIPULATION)
      // Paid services (amount > 0) MUST ALWAYS start as PENDING awaiting verified payment.
      // Free services (amount === 0) default to CONFIRMED.
      const initialStatus =
        serverCalculatedAmount > 0
          ? BookingStatus.PENDING
          : payload.status === BookingStatus.PENDING
          ? BookingStatus.PENDING
          : BookingStatus.CONFIRMED;

      // 9. GENERATE UNIQUE BOOKING ID / CODE
      const bookingCode = await generateUniqueBookingCode();

      // 10. CREATE BOOKING
      const created = await tx.booking.create({
        data: {
          bookingCode,
          studentId: studentUser.id,
          serviceId: service.id,
          status: initialStatus,
          amount: serverCalculatedAmount,
          scheduledAt: startOfDay,
          slotTime: payload.slotTime.trim(),
          location: service.location || 'Campus Operations Facility',
          notes: payload.notes?.trim() || null,
        },
        include: {
          student: {
            select: { id: true, name: true, email: true, phone: true, role: true },
          },
          service: {
            include: {
              category: { select: { id: true, name: true } },
              provider: { select: { id: true, name: true, email: true, phone: true } },
            },
          },
        },
      });

      // 10. NOTIFICATION FOR STUDENT: Booking Created
      await tx.notification.create({
        data: {
          userId: studentUser.id,
          type: NotificationType.BOOKING_CREATED,
          title: 'Booking Request Placed',
          message: `Your booking for "${service.name}" (${bookingCode}) on ${payload.scheduledAt} (${payload.slotTime}) has been created.`,
          link: `/student/bookings/${created.id}`,
        },
      });

      // 11. NOTIFICATION FOR PROVIDER: New Booking Request
      if (service.providerId) {
        await tx.notification.create({
          data: {
            userId: service.providerId,
            type: NotificationType.BOOKING_CREATED,
            title: 'New Booking Request',
            message: `${studentUser.name || 'A student'} placed a new reservation for "${service.name}" (${bookingCode}).`,
            link: '/provider/bookings',
          },
        });
      }

      // 12. NOTIFICATION FOR ADMIN: Check for Unusual Booking Activity (surge detection)
      const recentBookingsCount = await tx.booking.count({
        where: {
          serviceId: service.id,
          createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
        },
      });
      if (recentBookingsCount >= 5) {
        const admins = await tx.user.findMany({
          where: { role: Role.ADMIN },
          select: { id: true },
        });
        if (admins.length > 0) {
          await tx.notification.createMany({
            data: admins.map((admin) => ({
              userId: admin.id,
              type: NotificationType.SYSTEM_ALERT,
              title: 'Unusual Booking Activity Detected',
              message: `Surge Alert: ${recentBookingsCount} bookings created in the last 15 minutes for "${service.name}".`,
              link: '/admin/bookings',
            })),
          });
        }
      }

      return created;
    }, {
      maxWait: 10000,
      timeout: 25000,
    });

    // Revalidate paths for instant client-side update
    revalidatePath(`/student/services/${payload.serviceId}`);
    revalidatePath('/student/dashboard');
    revalidatePath('/provider/dashboard');
    revalidatePath('/provider/availability');

    return {
      success: true,
      booking: {
        id: bookingRecord.id,
        bookingCode: bookingRecord.bookingCode,
        status: bookingRecord.status,
        amount: bookingRecord.amount,
        scheduledAt: bookingRecord.scheduledAt.toISOString(),
        slotTime: bookingRecord.slotTime || payload.slotTime,
        location: bookingRecord.location || 'Campus Facilities',
        notes: bookingRecord.notes,
        createdAt: bookingRecord.createdAt.toISOString(),
        student: {
          id: studentUser.id,
          name: bookingRecord.student?.name || studentUser.name || 'Verified Student',
          email: bookingRecord.student?.email || studentUser.email,
          phone: bookingRecord.student?.phone || studentUser.phone || null,
          role: bookingRecord.student?.role || 'STUDENT',
        },
        provider: {
          id: bookingRecord.service?.provider?.id || 'campus-provider',
          name: bookingRecord.service?.provider?.name || 'Campus Operations & Facility Desk',
          email: bookingRecord.service?.provider?.email || 'operations@campus.edu',
          phone: bookingRecord.service?.provider?.phone || null,
        },
        service: {
          id: bookingRecord.serviceId,
          name: bookingRecord.service?.name || 'Campus Service',
          categoryName: bookingRecord.service?.category?.name || 'General Campus Service',
          durationMinutes: bookingRecord.service?.durationMinutes || 30,
          location: bookingRecord.service?.location || 'Campus Facility',
          price: bookingRecord.amount,
        },
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create service booking';
    return { success: false, error: message };
  }
}

export interface BookingReviewPricingBreakdown {
  basePrice: number;
  taxesAndFees: number;
  taxLabel: string;
  convenienceFee: number;
  studentSubsidy: number;
  finalAmount: number;
  isFree: boolean;
}

export interface BookingReviewData {
  service: {
    id: string;
    name: string;
    description: string | null;
    categoryName: string;
    categorySlug: string;
    categoryIcon: string | null;
    imageUrl: string | null;
    durationMinutes: number;
    capacity: number;
    location: string | null;
    price: number;
  };
  provider: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
  };
  student: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
  };
  schedule: {
    dateString: string;
    formattedDate: string;
    slotTime: string;
    durationMinutes: number;
  };
  pricing: BookingReviewPricingBreakdown;
  isAvailable: boolean;
  availabilityWarning?: string;
  notes?: string;
}

/**
 * Retrieves booking review details prior to payment without creating any database booking record.
 * Calculates taxes, fees, and final amount strictly on the server.
 */
export async function getBookingReviewSummary(params: {
  serviceId: string;
  date?: string;
  slot?: string;
  notes?: string;
}): Promise<BookingReviewData | null> {
  const user = await requireStudent();

  const service = await db.service.findFirst({
    where: {
      id: params.serviceId,
      isActive: true,
    },
    include: {
      category: true,
      provider: true,
      availabilities: { where: { isActive: true } },
      blockedPeriods: true,
    },
  });

  if (!service) return null;

  // Resolve target date (defaults to tomorrow if invalid or omitted)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const targetDateStr =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : tomorrow.toISOString().split('T')[0];

  const dateObj = new Date(`${targetDateStr}T00:00:00.000Z`);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const daysMap: DayOfWeek[] = [
    DayOfWeek.SUNDAY,
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SATURDAY,
  ];
  const dayOfWeekName = daysMap[dateObj.getUTCDay()];
  const dayAvail = service.availabilities.find((a) => a.dayOfWeek === dayOfWeekName);

  const startTime = dayAvail?.startTime || '09:00';
  const endTime = dayAvail?.endTime || '18:00';
  const slotDuration = dayAvail?.slotDuration || service.durationMinutes || 30;
  const slotCapacity = dayAvail?.maxBookingsPerSlot || service.capacity || 1;

  // Compute legitimate slots
  const validSlots = generateValidSlotsForDay(startTime, endTime, slotDuration);
  const targetSlot =
    params.slot && validSlots.includes(params.slot.trim())
      ? params.slot.trim()
      : validSlots[0] || '09:00 AM - 09:30 AM';

  // Check real-time availability without saving any booking
  const startOfDay = new Date(`${targetDateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${targetDateStr}T23:59:59.999Z`);

  const isFullDayBlocked = service.blockedPeriods.some((bp) => {
    if (!bp.isFullDay) return false;
    const startStr = bp.startDate.toISOString().split('T')[0];
    const endStr = bp.endDate.toISOString().split('T')[0];
    return targetDateStr >= startStr && targetDateStr <= endStr;
  });

  const activeBookingsCount = await db.booking.count({
    where: {
      serviceId: service.id,
      scheduledAt: { gte: startOfDay, lte: endOfDay },
      slotTime: targetSlot,
      status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] },
    },
  });

  let isAvailable = true;
  let availabilityWarning: string | undefined = undefined;

  if (isFullDayBlocked) {
    isAvailable = false;
    availabilityWarning = 'The service provider has blocked this date from reservations.';
  } else if (activeBookingsCount >= slotCapacity) {
    isAvailable = false;
    availabilityWarning = `This time slot has reached full capacity (${slotCapacity} student booking${
      slotCapacity > 1 ? 's' : ''
    }).`;
  }

  // Pricing calculations (Server side only)
  const basePrice = Math.max(0, Number(service.price) || 0);
  const isFree = basePrice === 0;
  const taxesAndFees = isFree ? 0 : Math.round(basePrice * 0.18 * 100) / 100;
  const convenienceFee = 0; // Waived for students
  const studentSubsidy = isFree ? 0 : 0;
  const finalAmount = basePrice; // Base rate is inclusive final payable amount

  return {
    service: {
      id: service.id,
      name: service.name,
      description: service.description,
      categoryName: service.category?.name || 'General Campus Service',
      categorySlug: service.category?.slug || 'other',
      categoryIcon: service.category?.icon || null,
      imageUrl: service.imageUrl,
      durationMinutes: service.durationMinutes,
      capacity: service.capacity,
      location: service.location,
      price: basePrice,
    },
    provider: {
      id: service.provider?.id || 'provider-desk',
      name: service.provider?.name || 'Campus Operations & Facilities Desk',
      email: service.provider?.email || 'operations@campus.edu',
      phone: service.provider?.phone || null,
      avatarUrl: service.provider?.avatarUrl || null,
    },
    student: {
      id: user.id,
      name: user.name && !user.name.startsWith('user_') ? user.name : 'Campus Student',
      email: user.email.startsWith('user_') && user.email.endsWith('@campusserve.edu') ? 'student@campus.edu' : user.email,
      phone: user.phone || null,
      role: 'STUDENT',
    },
    schedule: {
      dateString: targetDateStr,
      formattedDate,
      slotTime: targetSlot,
      durationMinutes: slotDuration,
    },
    pricing: {
      basePrice,
      taxesAndFees,
      taxLabel: isFree ? 'GST Exempt (Student Facility)' : 'GST (18% inclusive)',
      convenienceFee,
      studentSubsidy,
      finalAmount,
      isFree,
    },
    isAvailable,
    availabilityWarning,
    notes: params.notes,
  };
}

export type StudentBookingTabGroup = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type PaymentDisplayStatus = 'SUCCESSFUL' | 'PENDING' | 'FAILED' | 'REFUNDED' | 'FREE_PASS';

export interface StudentBookingItem {
  id: string;
  bookingCode: string;
  status: BookingStatus;
  tabGroup: StudentBookingTabGroup;
  amount: number;
  scheduledAt: string;
  formattedDate: string;
  slotTime: string;
  location: string;
  notes: string | null;
  createdAt: string;
  formattedCreatedAt: string;

  service: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    durationMinutes: number;
    price: number;
    location: string | null;
    category: {
      name: string;
      slug: string;
      icon: string | null;
    } | null;
  };

  provider: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
  };

  payment: {
    id: string | null;
    status: PaymentDisplayStatus;
    paymentCode: string | null;
    transactionId: string | null;
    orderId: string | null;
    amount: number;
    currency: string;
    paidAt: string | null;
    method: string | null;
  };

  canCancel: boolean;
  canPay: boolean;
  cancellationDeadline?: string | null;
  cancellationRestrictionReason?: string | null;
  refundEstimate?: {
    eligible: boolean;
    percentage: number;
    amount: number;
    description: string;
  };
}

export interface StudentBookingsResponse {
  bookings: StudentBookingItem[];
  counts: {
    all: number;
    upcoming: number;
    active: number;
    completed: number;
    cancelled: number;
  };
}

export type { CancellationEligibilityResult, CancellationRefundPolicy };

/**
 * Retrieves all bookings belonging to the currently authenticated student.
 * STRICT ACCESS CONTROL:
 * Students can NEVER view or retrieve any bookings belonging to another user.
 */
export async function getStudentBookingsAction(): Promise<StudentBookingsResponse> {
  const studentUser = await requireStudent();

  const rawBookings = await db.booking.findMany({
    where: {
      studentId: studentUser.id, // Strictly scoped
    },
    orderBy: {
      scheduledAt: 'desc',
    },
    include: {
      service: {
        include: {
          category: {
            select: {
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
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  const now = new Date();

  const formattedBookings: StudentBookingItem[] = rawBookings.map((b) => {
    const scheduledDate = new Date(b.scheduledAt);
    const isPast = scheduledDate.setHours(23, 59, 59, 999) < now.getTime();

    let tabGroup: StudentBookingTabGroup = 'UPCOMING';
    if (b.status === BookingStatus.CANCELLED || b.status === BookingStatus.REJECTED) {
      tabGroup = 'CANCELLED';
    } else if (b.status === BookingStatus.COMPLETED) {
      tabGroup = 'COMPLETED';
    } else if (b.status === BookingStatus.IN_PROGRESS) {
      tabGroup = 'ACTIVE';
    } else if (isPast && b.status !== BookingStatus.PENDING) {
      tabGroup = 'COMPLETED';
    } else {
      tabGroup = 'UPCOMING';
    }

    const successfulPayment = b.payments.find((p) => p.status === PaymentStatus.SUCCESSFUL);
    const pendingPayment = b.payments.find((p) => p.status === PaymentStatus.PENDING);
    const failedPayment = b.payments.find((p) => p.status === PaymentStatus.FAILED);
    const refundedPayment = b.payments.find((p) => p.status === PaymentStatus.REFUNDED);

    let paymentDisplayStatus: PaymentDisplayStatus = 'PENDING';
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

    const cancellationEval = evaluateCancellationEligibility(
      {
        status: b.status,
        scheduledAt: b.scheduledAt,
        slotTime: b.slotTime,
        amount: b.amount,
        payments: b.payments,
      },
      now
    );

    const canPay =
      b.status === BookingStatus.PENDING &&
      b.amount > 0 &&
      paymentDisplayStatus !== 'SUCCESSFUL';

    return {
      id: b.id,
      bookingCode: b.bookingCode,
      status: b.status,
      tabGroup,
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
      service: {
        id: b.service.id,
        name: b.service.name,
        description: b.service.description,
        imageUrl: b.service.imageUrl,
        durationMinutes: b.service.durationMinutes,
        price: Number(b.service.price),
        location: b.service.location,
        category: b.service.category,
      },
      provider: {
        id: b.service.provider?.id || 'campus-operations',
        name: b.service.provider?.name || 'Campus Operations Desk',
        email: b.service.provider?.email || 'operations@campus.edu',
        phone: b.service.provider?.phone || null,
        avatarUrl: b.service.provider?.avatarUrl || null,
      },
      payment: {
        id: primaryPayment?.id || null,
        status: paymentDisplayStatus,
        paymentCode: primaryPayment?.paymentCode || null,
        transactionId: primaryPayment?.transactionId || null,
        orderId: primaryPayment?.orderId || null,
        amount: primaryPayment ? Number(primaryPayment.amount) : b.amount,
        currency: primaryPayment?.currency || 'INR',
        paidAt: primaryPayment?.paidAt ? primaryPayment.paidAt.toISOString() : null,
        method: primaryPayment?.method || null,
      },
      canCancel: cancellationEval.canCancel,
      cancellationDeadline: cancellationEval.cancellationCutoffTime.toISOString(),
      cancellationRestrictionReason: cancellationEval.canCancel ? null : cancellationEval.reason || null,
      refundEstimate: cancellationEval.refundPolicy,
      canPay,
    };
  });

  const counts = {
    all: formattedBookings.length,
    upcoming: formattedBookings.filter((b) => b.tabGroup === 'UPCOMING').length,
    active: formattedBookings.filter((b) => b.tabGroup === 'ACTIVE').length,
    completed: formattedBookings.filter((b) => b.tabGroup === 'COMPLETED').length,
    cancelled: formattedBookings.filter((b) => b.tabGroup === 'CANCELLED').length,
  };

  return {
    bookings: formattedBookings,
    counts,
  };
}

/**
 * Cancels a student's booking under verified campus cancellation policy rules:
 * 1. STRICT ACCESS CONTROL: Only the authenticated student who created the reservation may cancel it.
 * 2. CANCELLATION PERIOD: Must be cancelled at least 1 hour prior to scheduled slot time.
 * 3. ATOMIC TRANSACTION:
 *    - Updates booking status to CANCELLED.
 *    - Records cancellation timestamp and student's stated reason.
 *    - Releases the availability slot immediately back to the public pool.
 *    - Handles payment state: marks successful payment as REFUNDED (100% refund).
 *    - Creates in-app notifications for both the student and the service provider.
 *    - Triggers multi-route revalidation.
 */
export async function cancelStudentBookingAction(bookingId: string, reason?: string) {
  try {
    const studentUser = await requireStudent();

    if (!bookingId) {
      return { success: false, error: 'Booking ID is required.' };
    }

    const booking = await db.booking.findFirst({
      where: {
        id: bookingId,
        studentId: studentUser.id, // Strictly scoped to authenticated student
      },
      include: {
        service: {
          include: {
            provider: { select: { id: true, name: true, email: true } },
          },
        },
        payments: true,
      },
    });

    if (!booking) {
      return {
        success: false,
        error: 'Booking not found or you are not authorized to cancel this reservation.',
      };
    }

    // Evaluate cancellation policy rules (notice period, slot start, status eligibility)
    const eligibility = evaluateCancellationEligibility(booking);
    if (!eligibility.canCancel) {
      return {
        success: false,
        error: eligibility.reason || 'This booking is not eligible for cancellation.',
      };
    }

    // Prepare cancellation timestamp and structured audit note
    const now = new Date();
    const isoTimestamp = now.toISOString();
    const displayTimestamp = now.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const cleanReason = reason?.trim() || 'Student requested cancellation';
    const cancellationAuditNote = `Cancelled by student on ${displayTimestamp} (UTC ${isoTimestamp}) | Reason: ${cleanReason}`;
    const updatedNotes = booking.notes
      ? `${booking.notes} | ${cancellationAuditNote}`
      : cancellationAuditNote;

    // Atomic transaction for state integrity
    const result = await db.$transaction(
      async (tx) => {
        // 1. Update Booking status to CANCELLED & record cancellation audit note
        const updatedBooking = await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: BookingStatus.CANCELLED,
            notes: updatedNotes,
          },
        });

        // 2. Handle Payment/Refund state appropriately
        const successfulPayment = booking.payments.find(
          (p) => p.status === PaymentStatus.SUCCESSFUL
        );
        let refundMessage = '';
        let refundIssued = false;

        if (successfulPayment) {
          await tx.payment.update({
            where: { id: successfulPayment.id },
            data: {
              status: PaymentStatus.REFUNDED,
              updatedAt: new Date(),
            },
          });
          refundIssued = true;
          refundMessage = ` A full refund of ₹${successfulPayment.amount} has been initiated to your original payment method.`;
        }

        // Void any pending payments so they cannot be completed later
        const pendingPayments = booking.payments.filter(
          (p) => p.status === PaymentStatus.PENDING
        );
        for (const p of pendingPayments) {
          await tx.payment.update({
            where: { id: p.id },
            data: { status: PaymentStatus.FAILED },
          });
        }

        // 3. Format date and slot for user notifications
        const formattedDate = booking.scheduledAt.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        const slotLabel = booking.slotTime || 'Standard Slot';

        // 4. Create in-app Notification for the Student (BOOKING_CANCELLED)
        await tx.notification.create({
          data: {
            userId: studentUser.id,
            title: `Reservation Cancelled: ${booking.bookingCode}`,
            message: `Your booking for "${booking.service.name}" on ${formattedDate} (${slotLabel}) has been cancelled.${refundMessage} Your reserved slot has been released.`,
            type: NotificationType.BOOKING_CANCELLED,
            link: `/student/bookings/${booking.id}`,
          },
        });

        // 5. If refund was processed, create explicit PAYMENT_REFUNDED notification for Student
        if (successfulPayment) {
          await tx.notification.create({
            data: {
              userId: studentUser.id,
              title: `Refund Initiated — ₹${successfulPayment.amount}`,
              message: `100% full refund of ₹${successfulPayment.amount} for booking ${booking.bookingCode} (${booking.service.name}) has been initiated. Reference: ${successfulPayment.transactionId || successfulPayment.paymentCode}.`,
              type: NotificationType.PAYMENT_REFUNDED,
              link: `/student/bookings/${booking.id}`,
            },
          });
        }

        // 6. Create in-app Notification for Service Provider (BOOKING_CANCELLED)
        if (booking.service.providerId) {
          await tx.notification.create({
            data: {
              userId: booking.service.providerId,
              title: `Slot Released: ${booking.bookingCode}`,
              message: `Student ${studentUser.name || 'Student'} cancelled reservation ${booking.bookingCode} for "${booking.service.name}" scheduled on ${formattedDate} (${slotLabel}). The slot is now open for new reservations.`,
              type: NotificationType.BOOKING_CANCELLED,
              link: '/provider/bookings',
            },
          });
        }

        // 7. Check for Admin: Unusual Cancellation Activity
        const recentCancellations = await tx.booking.count({
          where: {
            serviceId: booking.serviceId,
            status: BookingStatus.CANCELLED,
            updatedAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
          },
        });
        if (recentCancellations >= 3) {
          const admins = await tx.user.findMany({
            where: { role: Role.ADMIN },
            select: { id: true },
          });
          if (admins.length > 0) {
            await tx.notification.createMany({
              data: admins.map((admin) => ({
                userId: admin.id,
                type: NotificationType.SYSTEM_ALERT,
                title: 'Unusual Cancellation Spike Detected',
                message: `Cancellation Alert: ${recentCancellations} cancellations within 15 minutes for "${booking.service.name}".`,
                link: '/admin/bookings',
              })),
            });
          }
        }

        return {
          updatedBooking,
          refundIssued,
          refundAmount: successfulPayment ? Number(successfulPayment.amount) : 0,
          refundMessage,
        };
      },
      {
        maxWait: 10000,
        timeout: 25000,
      }
    );

    // Revalidate paths for instant client-side update
    revalidatePath('/student/bookings');
    revalidatePath(`/student/bookings/${booking.id}`);
    revalidatePath('/student/dashboard');
    revalidatePath(`/student/services/${booking.serviceId}`);
    revalidatePath(`/student/services/${booking.serviceId}/review`);
    revalidatePath('/provider/bookings');
    revalidatePath('/provider/dashboard');
    revalidatePath('/provider/availability');
    revalidatePath('/admin/dashboard');

    return {
      success: true,
      message: `Reservation ${booking.bookingCode} cancelled successfully.${result.refundMessage} Your time slot has been released.`,
      bookingCode: booking.bookingCode,
      refundIssued: result.refundIssued,
      refundAmount: result.refundAmount,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to cancel booking.';
    return { success: false, error: message };
  }
}

export interface BookingTrackingDetails {
  id: string;
  bookingCode: string;
  status: BookingStatus;
  amount: number;
  scheduledAt: string;
  formattedDate: string;
  slotTime: string;
  location: string;
  notes: string | null;
  createdAt: string;
  formattedCreatedAt: string;
  updatedAt: string;
  formattedUpdatedAt: string;

  isCancelled: boolean;
  cancelledAt: string | null;
  cancellationReason: string | null;

  service: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    price: number;
    durationMinutes: number;
    capacity: number;
    location: string | null;
    category: {
      name: string;
      slug: string;
      icon: string | null;
    } | null;
  };

  provider: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
  };

  student: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };

  payment: {
    id: string | null;
    status: PaymentDisplayStatus;
    amount: number;
    currency: string;
    method: string | null;
    paymentCode: string | null;
    transactionId: string | null;
    orderId: string | null;
    signature: string | null;
    paidAt: string | null;
    formattedPaidAt: string | null;
    allPayments: Array<{
      id: string;
      status: PaymentStatus;
      amount: number;
      method: string;
      transactionId: string | null;
      orderId: string | null;
      createdAt: string;
    }>;
  };

  feedback: {
    hasFeedback: boolean;
    rating: number | null;
    comment: string | null;
    submittedAt: string | null;
  } | null;

  canCancel: boolean;
  canPay: boolean;
  canReview: boolean;
  cancellationDeadline?: string | null;
  cancellationRestrictionReason?: string | null;
  refundEstimate?: {
    eligible: boolean;
    percentage: number;
    amount: number;
    description: string;
  };
}

/**
 * Retrieves full tracking and timeline details for a specific booking.
 * STRICT ACCESS CONTROL:
 * Students can NEVER view another user's booking. The query strictly verifies studentId === studentUser.id.
 */
export async function getStudentBookingTrackingDetails(
  bookingId: string
): Promise<BookingTrackingDetails | null> {
  const studentUser = await requireStudent();

  if (!bookingId) {
    return null;
  }

  const b = await db.booking.findFirst({
    where: {
      id: bookingId,
      studentId: studentUser.id, // Strictly scoped to authenticated student
    },
    include: {
      service: {
        include: {
          category: {
            select: {
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
        orderBy: {
          createdAt: 'desc',
        },
      },
      review: true,
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!b) {
    return null;
  }

  const now = new Date();
  const isCancelled = b.status === BookingStatus.CANCELLED || b.status === BookingStatus.REJECTED;

  let cancellationReason: string | null = null;
  if (isCancelled && b.notes) {
    const match = b.notes.match(/(?:Cancellation reason|Cancelled by student|Rejected):\s*([^|]+)/i);
    cancellationReason = match ? match[1].trim() : b.notes;
  }

  const successfulPayment = b.payments.find((p) => p.status === PaymentStatus.SUCCESSFUL);
  const pendingPayment = b.payments.find((p) => p.status === PaymentStatus.PENDING);
  const failedPayment = b.payments.find((p) => p.status === PaymentStatus.FAILED);
  const refundedPayment = b.payments.find((p) => p.status === PaymentStatus.REFUNDED);

  let paymentDisplayStatus: PaymentDisplayStatus = 'PENDING';
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

  const cancellationEval = evaluateCancellationEligibility(
    {
      status: b.status,
      scheduledAt: b.scheduledAt,
      slotTime: b.slotTime,
      amount: b.amount,
      payments: b.payments,
    },
    now
  );

  const canPay =
    b.status === BookingStatus.PENDING &&
    b.amount > 0 &&
    paymentDisplayStatus !== 'SUCCESSFUL';

  const canReview = b.status === BookingStatus.COMPLETED && !b.review;

  return {
    id: b.id,
    bookingCode: b.bookingCode,
    status: b.status,
    amount: b.amount,
    scheduledAt: b.scheduledAt.toISOString(),
    formattedDate: b.scheduledAt.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    slotTime: b.slotTime || 'Standard Slot',
    location: b.location || b.service.location || 'Campus Facilities Desk',
    notes: b.notes,
    createdAt: b.createdAt.toISOString(),
    formattedCreatedAt: b.createdAt.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    updatedAt: b.updatedAt.toISOString(),
    formattedUpdatedAt: b.updatedAt.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    isCancelled,
    cancelledAt: isCancelled ? b.updatedAt.toISOString() : null,
    cancellationReason,
    service: {
      id: b.service.id,
      name: b.service.name,
      description: b.service.description,
      imageUrl: b.service.imageUrl,
      price: Number(b.service.price),
      durationMinutes: b.service.durationMinutes,
      capacity: b.service.capacity,
      location: b.service.location,
      category: b.service.category,
    },
    provider: {
      id: b.service.provider?.id || 'campus-operations',
      name: b.service.provider?.name || 'Campus Operations Desk',
      email: b.service.provider?.email || 'operations@campus.edu',
      phone: b.service.provider?.phone || null,
      avatarUrl: b.service.provider?.avatarUrl || null,
    },
    student: {
      id: b.student?.id || studentUser.id,
      name: b.student?.name || studentUser.name || 'Verified Student',
      email: b.student?.email || studentUser.email,
      phone: b.student?.phone || studentUser.phone || null,
    },
    payment: {
      id: primaryPayment?.id || null,
      status: paymentDisplayStatus,
      amount: primaryPayment ? Number(primaryPayment.amount) : b.amount,
      currency: primaryPayment?.currency || 'INR',
      method: primaryPayment?.method || null,
      paymentCode: primaryPayment?.paymentCode || null,
      transactionId: primaryPayment?.transactionId || null,
      orderId: primaryPayment?.orderId || null,
      signature: primaryPayment?.signature || null,
      paidAt: primaryPayment?.paidAt ? primaryPayment.paidAt.toISOString() : null,
      formattedPaidAt: primaryPayment?.paidAt
        ? primaryPayment.paidAt.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : null,
      allPayments: b.payments.map((p) => ({
        id: p.id,
        status: p.status,
        amount: Number(p.amount),
        method: p.method,
        transactionId: p.transactionId,
        orderId: p.orderId,
        createdAt: p.createdAt.toISOString(),
      })),
    },
    feedback: b.review
      ? {
          hasFeedback: true,
          rating: b.review.rating,
          comment: b.review.comment,
          submittedAt: b.review.createdAt.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        }
      : {
          hasFeedback: false,
          rating: null,
          comment: null,
          submittedAt: null,
        },
    canCancel: cancellationEval.canCancel,
    cancellationDeadline: cancellationEval.cancellationCutoffTime.toISOString(),
    cancellationRestrictionReason: cancellationEval.canCancel ? null : cancellationEval.reason || null,
    refundEstimate: cancellationEval.refundPolicy,
    canPay,
    canReview,
  };
}

/**
 * Submits student feedback / review for a completed booking.
 * STRICT ACCESS CONTROL:
 * Strictly verifies that the booking belongs to the authenticated student and is COMPLETED.
 */
export async function submitBookingFeedbackAction(input: {
  bookingId: string;
  rating: number;
  comment?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const studentUser = await requireStudent();

    if (!input.bookingId) {
      return { success: false, error: 'Booking ID is required.' };
    }

    if (
      !input.rating ||
      !Number.isInteger(input.rating) ||
      input.rating < 1 ||
      input.rating > 5
    ) {
      return { success: false, error: 'Please select a valid star rating between 1 and 5.' };
    }

    const booking = await db.booking.findFirst({
      where: {
        id: input.bookingId,
        studentId: studentUser.id, // Strictly scoped to authenticated student
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            providerId: true,
          },
        },
      },
    });

    if (!booking) {
      return {
        success: false,
        error: 'Booking not found or you are not authorized to submit feedback for this booking.',
      };
    }

    // STRICT REQUIREMENT: Only students who completed a booking can review the service
    if (booking.status !== BookingStatus.COMPLETED) {
      return {
        success: false,
        error: 'Feedback can only be submitted after your service session has been marked as COMPLETED by the provider.',
      };
    }

    // STRICT REQUIREMENT: Prevent duplicate reviews for the same booking
    const existingReview = await db.review.findUnique({
      where: { bookingId: booking.id },
    });

    if (existingReview) {
      return {
        success: false,
        error: 'A review has already been submitted for this booking. Duplicate reviews are not permitted.',
      };
    }

    const sanitizedComment = input.comment?.trim()
      ? input.comment.trim().slice(0, 1000)
      : null;

    await db.review.create({
      data: {
        bookingId: booking.id,
        serviceId: booking.serviceId,
        userId: studentUser.id,
        rating: input.rating,
        comment: sanitizedComment,
      },
    });

    // Notify provider of received feedback if service has an assigned provider
    if (booking.service?.providerId) {
      try {
        await db.notification.create({
          data: {
            userId: booking.service.providerId,
            type: NotificationType.REVIEW_RECEIVED,
            title: 'New Student Review Received',
            message: `${studentUser.name || 'A student'} rated "${booking.service.name}" with ${input.rating} stars.`,
            link: `/provider/services/${booking.serviceId}`,
          },
        });
      } catch (notifyErr) {
        console.error('Failed to dispatch provider notification for review:', notifyErr);
      }
    }

    revalidatePath(`/student/bookings/${booking.id}`);
    revalidatePath('/student/bookings');
    revalidatePath(`/student/services/${booking.serviceId}`);
    revalidatePath('/provider/dashboard');
    revalidatePath(`/provider/services/${booking.serviceId}`);
    revalidatePath('/admin/dashboard');

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to submit feedback.';
    return { success: false, error: message };
  }
}
