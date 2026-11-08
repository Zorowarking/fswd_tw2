'use client';

import * as React from 'react';
import {
  CheckCircle2,
  Clock,
  CreditCard,
  CalendarCheck,
  Sparkles,
  Award,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { type BookingTrackingDetails } from '@/app/actions/booking-actions';

interface BookingTimelineProps {
  booking: BookingTrackingDetails;
}

interface TimelineStep {
  id: string;
  label: string;
  description: string;
  timestamp: string | null;
  state: 'completed' | 'active' | 'upcoming' | 'failed' | 'cancelled';
  icon: React.ComponentType<{ className?: string }>;
}

export function BookingTimeline({ booking }: BookingTimelineProps) {
  const isCancelled = booking.isCancelled;
  const isPending = booking.status === 'PENDING';
  const isConfirmed = booking.status === 'CONFIRMED';
  const isInProgress = booking.status === 'IN_PROGRESS';
  const isCompleted = booking.status === 'COMPLETED';

  const isPaymentPaid =
    booking.payment.status === 'SUCCESSFUL' || booking.payment.status === 'FREE_PASS';
  const isPaymentRefunded = booking.payment.status === 'REFUNDED';
  const isPaymentFailed = booking.payment.status === 'FAILED';

  // Construct 5-stage timeline
  const steps: TimelineStep[] = [
    {
      id: 'step-created',
      label: 'Booking Created',
      description: `Reservation initialized with token ${booking.bookingCode}.`,
      timestamp: booking.formattedCreatedAt,
      state: 'completed',
      icon: CalendarCheck,
    },
    {
      id: 'step-payment',
      label: isPaymentRefunded ? 'Payment Refunded' : 'Payment',
      description:
        booking.amount === 0
          ? 'Free Campus Grant applied (₹0 fee waived).'
          : isPaymentRefunded
          ? `Full refund of ₹${booking.amount} processed to original payment source.`
          : isPaymentPaid
          ? `Verified ₹${booking.amount} via Razorpay (Tx: ${booking.payment.transactionId || 'Confirmed'}).`
          : isPaymentFailed
          ? 'Payment verification failed. Please re-try checkout.'
          : 'Pending payment authorization.',
      timestamp: booking.payment.formattedPaidAt || (isPaymentPaid || isPaymentRefunded ? booking.formattedCreatedAt : null),
      state: isPaymentPaid || isPaymentRefunded
        ? 'completed'
        : isPaymentFailed
        ? 'failed'
        : isPending
        ? 'active'
        : 'upcoming',
      icon: CreditCard,
    },
    {
      id: 'step-confirmed',
      label: 'Confirmed',
      description: isCancelled
        ? `Reservation was cancelled (${booking.cancellationReason || 'Slot released'}).`
        : isConfirmed || isInProgress || isCompleted
        ? 'Reservation confirmed by Campus Operations Desk.'
        : 'Awaiting payment confirmation.',
      timestamp:
        isCancelled
          ? booking.formattedUpdatedAt
          : isConfirmed || isInProgress || isCompleted
          ? booking.payment.formattedPaidAt || booking.formattedCreatedAt
          : null,
      state: isCancelled
        ? 'cancelled'
        : isConfirmed || isInProgress || isCompleted
        ? 'completed'
        : isPending
        ? 'upcoming'
        : 'upcoming',
      icon: isCancelled ? XCircle : CheckCircle2,
    },
    {
      id: 'step-in-progress',
      label: 'In Progress',
      description: isCancelled
        ? 'Session terminated prior to commencement.'
        : isInProgress
        ? 'Service is currently active. Student checked in at location.'
        : isCompleted
        ? 'Service session held as scheduled.'
        : `Scheduled for ${booking.slotTime} on ${booking.formattedDate}.`,
      timestamp: isInProgress || isCompleted ? booking.slotTime : null,
      state: isCancelled
        ? 'cancelled'
        : isCompleted
        ? 'completed'
        : isInProgress
        ? 'active'
        : 'upcoming',
      icon: Sparkles,
    },
    {
      id: 'step-completed',
      label: 'Completed',
      description: isCancelled
        ? 'Reservation did not conclude.'
        : isCompleted
        ? 'Service successfully fulfilled. Student feedback unlocked.'
        : 'Final conclusion pending session completion.',
      timestamp: isCompleted ? booking.formattedUpdatedAt : null,
      state: isCancelled ? 'cancelled' : isCompleted ? 'completed' : 'upcoming',
      icon: Award,
    },
  ];

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Booking Timeline
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time step-by-step audit progression for this reservation.
          </p>
        </div>

        <Badge
          variant="outline"
          className={
            isCompleted
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs'
              : isInProgress
              ? 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold text-xs animate-pulse'
              : isCancelled
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold text-xs'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-xs'
          }
        >
          {isCompleted
            ? 'Completed'
            : isInProgress
            ? 'In Progress'
            : isCancelled
            ? 'Cancelled'
            : 'Confirmed / Scheduled'}
        </Badge>
      </div>

      {/* Stepper Progression */}
      <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-[17px] sm:before:left-[21px] before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
        {steps.map((step) => {
          const StepIcon = step.icon;

          const isStepCompleted = step.state === 'completed';
          const isStepActive = step.state === 'active';
          const isStepFailed = step.state === 'failed';
          const isStepCancelled = step.state === 'cancelled';

          return (
            <div key={step.id} className="relative group">
              {/* Stepper Node Icon */}
              <div
                className={`absolute -left-[24px] sm:-left-[28px] top-0.5 flex h-8 w-8 sm:h-9 sm:sm:w-9 items-center justify-center rounded-full border-2 transition-all ${
                  isStepCompleted
                    ? 'border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : isStepActive
                    ? 'border-blue-600 bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950 animate-pulse'
                    : isStepFailed || isStepCancelled
                    ? 'border-rose-500 bg-rose-500 text-white'
                    : 'border-border bg-background text-muted-foreground'
                }`}
              >
                <StepIcon className="h-4 w-4" />
              </div>

              {/* Step Content */}
              <div className="ml-3 sm:ml-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <div>
                  <div className="flex items-center gap-2">
                    <h3
                      className={`text-sm font-bold ${
                        isStepCompleted
                          ? 'text-foreground'
                          : isStepActive
                          ? 'text-blue-600 dark:text-blue-400'
                          : isStepFailed || isStepCancelled
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                    </h3>

                    {isStepActive && (
                      <Badge className="bg-blue-600 text-white text-[10px] py-0 px-1.5 h-4">
                        Current
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed max-w-xl">
                    {step.description}
                  </p>
                </div>

                {step.timestamp && (
                  <span className="text-[11px] font-mono text-muted-foreground/80 shrink-0 mt-0.5 sm:mt-0">
                    {step.timestamp}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
