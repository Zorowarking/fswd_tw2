'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireServiceProvider } from '@/lib/auth-role';
import { DayOfWeek, BookingStatus } from '@prisma/client';

export interface WeeklyDayConfig {
  dayOfWeek: DayOfWeek;
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  slotDuration: number; // 30
  maxBookingsPerSlot: number; // 1
  isActive: boolean;
}

export interface BlockedPeriodItem {
  id: string;
  serviceId: string;
  startDate: string; // "2026-11-10"
  endDate: string; // "2026-11-10"
  startTime: string | null; // "13:00"
  endTime: string | null; // "15:00"
  reason: string | null;
  isFullDay: boolean;
  createdAt: string;
}

export interface ProviderAvailabilityServiceSummary {
  id: string;
  name: string;
  capacity: number;
  durationMinutes: number;
  isActive: boolean;
  location: string | null;
}

export interface ProviderAvailabilityData {
  services: ProviderAvailabilityServiceSummary[];
  selectedService: ProviderAvailabilityServiceSummary | null;
  weeklySchedule: WeeklyDayConfig[];
  blockedPeriods: BlockedPeriodItem[];
  bookingsCountByDate: Record<string, number>;
}

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

const DEFAULT_WEEKLY_DAYS: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

/**
 * Loads provider availability data for calendar and scheduling management.
 * Strictly verifies provider authentication and ownership.
 */
export async function getProviderAvailabilityData(
  serviceId?: string
): Promise<ProviderAvailabilityData> {
  const user = await requireServiceProvider();

  // 1. Fetch all services owned by this provider
  const servicesRaw = await db.service.findMany({
    where: {
      providerId: user.id,
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      capacity: true,
      durationMinutes: true,
      isActive: true,
      location: true,
    },
  });

  if (servicesRaw.length === 0) {
    return {
      services: [],
      selectedService: null,
      weeklySchedule: [],
      blockedPeriods: [],
      bookingsCountByDate: {},
    };
  }

  // 2. Resolve selected service (either requested or first owned service)
  const activeService =
    servicesRaw.find((s) => s.id === serviceId) || servicesRaw[0];

  // 3. Fetch recurring availability
  const dbAvailabilities = await db.serviceAvailability.findMany({
    where: {
      serviceId: activeService.id,
    },
  });

  // Construct standard 7-day configuration
  const weeklySchedule: WeeklyDayConfig[] = DEFAULT_WEEKLY_DAYS.map((day) => {
    const found = dbAvailabilities.find((a) => a.dayOfWeek === day);
    if (found) {
      return {
        dayOfWeek: found.dayOfWeek,
        startTime: found.startTime,
        endTime: found.endTime,
        slotDuration: found.slotDuration,
        maxBookingsPerSlot: found.maxBookingsPerSlot,
        isActive: found.isActive,
      };
    }

    // Default hours if unconfigured
    const isSunday = day === DayOfWeek.SUNDAY;
    const isSaturday = day === DayOfWeek.SATURDAY;
    return {
      dayOfWeek: day,
      startTime: isSunday ? '10:00' : '09:00',
      endTime: isSunday ? '14:00' : isSaturday ? '16:00' : '17:00',
      slotDuration: activeService.durationMinutes || 30,
      maxBookingsPerSlot: activeService.capacity || 1,
      isActive: !isSunday,
    };
  });

  // 4. Fetch blocked dates and unavailable periods
  const dbBlockedPeriods = await db.serviceBlockedPeriod.findMany({
    where: {
      serviceId: activeService.id,
    },
    orderBy: { startDate: 'asc' },
  });

  const blockedPeriods: BlockedPeriodItem[] = dbBlockedPeriods.map((bp) => ({
    id: bp.id,
    serviceId: bp.serviceId,
    startDate: bp.startDate.toISOString().split('T')[0],
    endDate: bp.endDate.toISOString().split('T')[0],
    startTime: bp.startTime,
    endTime: bp.endTime,
    reason: bp.reason,
    isFullDay: bp.isFullDay,
    createdAt: bp.createdAt.toISOString(),
  }));

  // 5. Fetch upcoming bookings to count density per day
  const upcomingBookings = await db.booking.findMany({
    where: {
      serviceId: activeService.id,
      status: {
        in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS],
      },
    },
    select: {
      scheduledAt: true,
    },
  });

  const bookingsCountByDate: Record<string, number> = {};
  for (const b of upcomingBookings) {
    const dateKey = b.scheduledAt.toISOString().split('T')[0];
    bookingsCountByDate[dateKey] = (bookingsCountByDate[dateKey] || 0) + 1;
  }

  return {
    services: servicesRaw,
    selectedService: activeService,
    weeklySchedule,
    blockedPeriods,
    bookingsCountByDate,
  };
}

/**
 * Saves recurring weekly operating schedule for a service.
 */
export async function saveWeeklySchedule(
  serviceId: string,
  schedule: WeeklyDayConfig[]
): Promise<ActionResponse<{ count: number }>> {
  try {
    const user = await requireServiceProvider();

    // Verify ownership
    const service = await db.service.findFirst({
      where: {
        id: serviceId,
        providerId: user.id,
      },
      select: { id: true },
    });

    if (!service) {
      return { success: false, error: 'Service not found or permission denied.' };
    }

    // Replace previous availabilities in a transaction and synchronize capacity
    await db.$transaction(async (tx) => {
      await tx.serviceAvailability.deleteMany({
        where: { serviceId },
      });

      let maxCapacity = 1;
      for (const dayConfig of schedule) {
        if (dayConfig.maxBookingsPerSlot > maxCapacity) {
          maxCapacity = dayConfig.maxBookingsPerSlot;
        }
        await tx.serviceAvailability.create({
          data: {
            serviceId,
            dayOfWeek: dayConfig.dayOfWeek,
            startTime: dayConfig.startTime,
            endTime: dayConfig.endTime,
            slotDuration: dayConfig.slotDuration,
            maxBookingsPerSlot: dayConfig.maxBookingsPerSlot,
            isActive: dayConfig.isActive,
          },
        });
      }

      await tx.service.update({
        where: { id: serviceId },
        data: { capacity: maxCapacity },
      });
    });

    revalidatePath('/provider/availability');
    revalidatePath('/provider/services');
    revalidatePath(`/provider/services/${serviceId}`);
    revalidatePath(`/student/services/${serviceId}`);

    return { success: true, data: { count: schedule.length } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save weekly schedule';
    return { success: false, error: message };
  }
}

/**
 * Updates default service capacity and duration.
 */
export async function updateServiceCapacity(
  serviceId: string,
  capacity: number,
  durationMinutes?: number
): Promise<ActionResponse<{ capacity: number; durationMinutes: number }>> {
  try {
    const user = await requireServiceProvider();

    const service = await db.service.findFirst({
      where: {
        id: serviceId,
        providerId: user.id,
      },
      select: { id: true, durationMinutes: true },
    });

    if (!service) {
      return { success: false, error: 'Service not found or permission denied.' };
    }

    const validCapacity = Math.max(1, Math.floor(capacity));
    const validDuration = durationMinutes
      ? Math.max(5, Math.floor(durationMinutes))
      : service.durationMinutes;

    await db.$transaction(async (tx) => {
      await tx.service.update({
        where: { id: serviceId },
        data: {
          capacity: validCapacity,
          durationMinutes: validDuration,
        },
      });

      // Update existing availabilities default capacity if present
      await tx.serviceAvailability.updateMany({
        where: { serviceId },
        data: {
          maxBookingsPerSlot: validCapacity,
          slotDuration: validDuration,
        },
      });
    });

    revalidatePath('/provider/availability');
    revalidatePath('/provider/services');
    revalidatePath(`/provider/services/${serviceId}`);
    revalidatePath(`/student/services/${serviceId}`);

    return {
      success: true,
      data: { capacity: validCapacity, durationMinutes: validDuration },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update capacity';
    return { success: false, error: message };
  }
}

/**
 * Adds a blocked date or unavailable period.
 */
export async function addBlockedPeriod(
  serviceId: string,
  payload: {
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    isFullDay: boolean;
    startTime?: string; // HH:mm
    endTime?: string; // HH:mm
    reason?: string;
  }
): Promise<ActionResponse<BlockedPeriodItem>> {
  try {
    const user = await requireServiceProvider();

    // Verify ownership
    const service = await db.service.findFirst({
      where: {
        id: serviceId,
        providerId: user.id,
      },
      select: { id: true },
    });

    if (!service) {
      return { success: false, error: 'Service not found or permission denied.' };
    }

    const start = new Date(`${payload.startDate}T00:00:00.000Z`);
    const end = new Date(`${payload.endDate}T23:59:59.999Z`);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { success: false, error: 'Invalid start or end date.' };
    }

    if (start > end) {
      return { success: false, error: 'Start date must be before or equal to end date.' };
    }

    const created = await db.serviceBlockedPeriod.create({
      data: {
        serviceId,
        startDate: start,
        endDate: end,
        isFullDay: payload.isFullDay,
        startTime: payload.isFullDay ? null : payload.startTime || null,
        endTime: payload.isFullDay ? null : payload.endTime || null,
        reason: payload.reason?.trim() || null,
      },
    });

    revalidatePath('/provider/availability');
    revalidatePath(`/provider/services/${serviceId}`);
    revalidatePath(`/student/services/${serviceId}`);

    return {
      success: true,
      data: {
        id: created.id,
        serviceId: created.serviceId,
        startDate: created.startDate.toISOString().split('T')[0],
        endDate: created.endDate.toISOString().split('T')[0],
        startTime: created.startTime,
        endTime: created.endTime,
        reason: created.reason,
        isFullDay: created.isFullDay,
        createdAt: created.createdAt.toISOString(),
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to add blocked period';
    return { success: false, error: message };
  }
}

/**
 * Removes a blocked period / date restriction.
 */
export async function removeBlockedPeriod(
  blockedPeriodId: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const user = await requireServiceProvider();

    const existing = await db.serviceBlockedPeriod.findUnique({
      where: { id: blockedPeriodId },
      include: {
        service: {
          select: {
            id: true,
            providerId: true,
          },
        },
      },
    });

    if (!existing || existing.service.providerId !== user.id) {
      return {
        success: false,
        error: 'Blocked period not found or you do not have permission to delete it.',
      };
    }

    await db.serviceBlockedPeriod.delete({
      where: { id: blockedPeriodId },
    });

    revalidatePath('/provider/availability');
    revalidatePath(`/provider/services/${existing.service.id}`);
    revalidatePath(`/student/services/${existing.service.id}`);

    return { success: true, data: { id: blockedPeriodId } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to remove blocked period';
    return { success: false, error: message };
  }
}

/**
 * Quick toggle for a single date (block or unblock).
 */
export async function quickToggleDateBlocked(
  serviceId: string,
  dateString: string,
  reason?: string
): Promise<ActionResponse<{ isBlocked: boolean }>> {
  try {
    const user = await requireServiceProvider();

    const service = await db.service.findFirst({
      where: {
        id: serviceId,
        providerId: user.id,
      },
      select: { id: true },
    });

    if (!service) {
      return { success: false, error: 'Service not found or permission denied.' };
    }

    const start = new Date(`${dateString}T00:00:00.000Z`);
    const end = new Date(`${dateString}T23:59:59.999Z`);

    // Check if date is currently blocked
    const existing = await db.serviceBlockedPeriod.findFirst({
      where: {
        serviceId,
        isFullDay: true,
        startDate: { lte: end },
        endDate: { gte: start },
      },
    });

    if (existing) {
      // Unblock
      await db.serviceBlockedPeriod.delete({
        where: { id: existing.id },
      });

      revalidatePath('/provider/availability');
      revalidatePath(`/provider/services/${serviceId}`);
      revalidatePath(`/student/services/${serviceId}`);

      return { success: true, data: { isBlocked: false } };
    } else {
      // Block
      await db.serviceBlockedPeriod.create({
        data: {
          serviceId,
          startDate: start,
          endDate: end,
          isFullDay: true,
          reason: reason || 'Blocked by service provider',
        },
      });

      revalidatePath('/provider/availability');
      revalidatePath(`/provider/services/${serviceId}`);
      revalidatePath(`/student/services/${serviceId}`);

      return { success: true, data: { isBlocked: true } };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to toggle date block';
    return { success: false, error: message };
  }
}
