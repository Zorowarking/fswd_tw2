import { BookingStatus, PaymentStatus } from '@prisma/client';

/**
 * Minimum advance notice required for a student to cancel a reservation.
 * Bookings cannot be cancelled if less than this amount of time remains before the slot start.
 */
export const CANCELLATION_MINIMUM_NOTICE_HOURS = 1;

/**
 * Helper to parse time strings like "09:00", "09:00 AM", "02:30 PM", "14:00" into minutes from midnight (0-1439).
 */
export function parseTimeToMinutes(timeStr: string): number {
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
 * Extracts slot start minutes from slot label (e.g. "09:00 AM - 12:00 PM" -> 540).
 */
export function extractSlotStartMinutes(slotTime?: string | null): number {
  if (!slotTime) return 0;
  const startPart = slotTime.split('-')[0]?.trim() || '';
  return parseTimeToMinutes(startPart);
}

/**
 * Derives the exact scheduled slot start Date in local time based on scheduledAt date and slotTime.
 */
export function getSlotStartDateTime(scheduledAt: Date | string, slotTime?: string | null): Date {
  const d = new Date(scheduledAt);
  const dateStr = d.toISOString().split('T')[0];
  const [year, month, day] = dateStr.split('-').map(Number);
  const startMinutes = extractSlotStartMinutes(slotTime);
  const hours = Math.floor(startMinutes / 60);
  const minutes = startMinutes % 60;
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export interface CancellationRefundPolicy {
  eligible: boolean;
  percentage: number;
  amount: number;
  description: string;
}

export interface CancellationEligibilityResult {
  canCancel: boolean;
  reason?: string;
  cancellationCutoffTime: Date;
  formattedCutoffTime: string;
  slotStartTime: Date;
  formattedSlotStartTime: string;
  isPast: boolean;
  refundPolicy: CancellationRefundPolicy;
}

/**
 * Evaluates whether a booking is eligible for student cancellation under CampusServe rules:
 * 1. Booking State: Only PENDING or CONFIRMED bookings may be cancelled.
 * 2. Cutoff Window: Must be requested at least 1 hour prior to scheduled slot start.
 * 3. Terminal States: Completed, active in-progress, or already cancelled bookings cannot be cancelled.
 * 4. Refund Policy: 100% full refund on paid reservations; fee waiver on free campus passes.
 */
export function evaluateCancellationEligibility(
  booking: {
    status: BookingStatus;
    scheduledAt: Date | string;
    slotTime?: string | null;
    amount: number;
    payments?: Array<{ status: PaymentStatus; amount: number }>;
  },
  now: Date = new Date()
): CancellationEligibilityResult {
  const slotStartTime = getSlotStartDateTime(booking.scheduledAt, booking.slotTime);
  const cutoffTime = new Date(
    slotStartTime.getTime() - CANCELLATION_MINIMUM_NOTICE_HOURS * 60 * 60 * 1000
  );

  const isPast = now.getTime() >= slotStartTime.getTime();
  const isCutoffPassed = now.getTime() > cutoffTime.getTime();

  // Determine refund policy
  const hasSuccessfulPayment = booking.payments?.some(
    (p) => p.status === PaymentStatus.SUCCESSFUL
  );

  const refundPolicy: CancellationRefundPolicy =
    booking.amount === 0
      ? {
          eligible: false,
          percentage: 0,
          amount: 0,
          description: 'Free campus pass — no payment was charged.',
        }
      : hasSuccessfulPayment
      ? {
          eligible: true,
          percentage: 100,
          amount: Number(booking.amount),
          description: `100% full refund (₹${booking.amount}) will be credited to original payment source.`,
        }
      : {
          eligible: false,
          percentage: 0,
          amount: 0,
          description: 'Pending payment order will be voided. No charges incurred.',
        };

  const formattedCutoffTime = cutoffTime.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const formattedSlotStartTime = slotStartTime.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  if (booking.status === BookingStatus.CANCELLED) {
    return {
      canCancel: false,
      reason: 'This booking has already been cancelled.',
      cancellationCutoffTime: cutoffTime,
      formattedCutoffTime,
      slotStartTime,
      formattedSlotStartTime,
      isPast,
      refundPolicy,
    };
  }

  if (booking.status === BookingStatus.REJECTED) {
    return {
      canCancel: false,
      reason: 'This booking was declined by the service provider.',
      cancellationCutoffTime: cutoffTime,
      formattedCutoffTime,
      slotStartTime,
      formattedSlotStartTime,
      isPast,
      refundPolicy,
    };
  }

  if (booking.status === BookingStatus.COMPLETED) {
    return {
      canCancel: false,
      reason: 'Completed bookings cannot be cancelled.',
      cancellationCutoffTime: cutoffTime,
      formattedCutoffTime,
      slotStartTime,
      formattedSlotStartTime,
      isPast,
      refundPolicy,
    };
  }

  if (booking.status === BookingStatus.IN_PROGRESS) {
    return {
      canCancel: false,
      reason: 'This campus service is currently in progress and cannot be cancelled.',
      cancellationCutoffTime: cutoffTime,
      formattedCutoffTime,
      slotStartTime,
      formattedSlotStartTime,
      isPast,
      refundPolicy,
    };
  }

  if (isPast) {
    return {
      canCancel: false,
      reason: 'The scheduled booking slot has already started or passed.',
      cancellationCutoffTime: cutoffTime,
      formattedCutoffTime,
      slotStartTime,
      formattedSlotStartTime,
      isPast,
      refundPolicy,
    };
  }

  if (isCutoffPassed) {
    return {
      canCancel: false,
      reason: `Cancellation window closed. Bookings must be cancelled at least ${CANCELLATION_MINIMUM_NOTICE_HOURS} hour before the scheduled start time (${formattedCutoffTime}).`,
      cancellationCutoffTime: cutoffTime,
      formattedCutoffTime,
      slotStartTime,
      formattedSlotStartTime,
      isPast,
      refundPolicy,
    };
  }

  return {
    canCancel: true,
    cancellationCutoffTime: cutoffTime,
    formattedCutoffTime,
    slotStartTime,
    formattedSlotStartTime,
    isPast,
    refundPolicy,
  };
}

