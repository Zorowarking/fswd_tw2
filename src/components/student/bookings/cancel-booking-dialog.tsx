'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  Loader2,
  AlertTriangle,
  CreditCard,
  ShieldAlert,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import { cancelStudentBookingAction, type StudentBookingItem } from '@/app/actions/booking-actions';
import { toast } from 'sonner';

interface CancelBookingDialogProps {
  booking: StudentBookingItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const COMMON_CANCELLATION_REASONS = [
  'Lecture / Lab Schedule Conflict',
  'Health or Personal Emergency',
  'Booked Wrong Date or Time Slot',
  'Service No Longer Needed',
  'Other Reason',
];

export function CancelBookingDialog({
  booking,
  open,
  onOpenChange,
  onSuccess,
}: CancelBookingDialogProps) {
  const [selectedReasonChip, setSelectedReasonChip] = React.useState<string>('');
  const [customReason, setCustomReason] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const resetForm = () => {
    setSelectedReasonChip('');
    setCustomReason('');
    setIsSubmitting(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  if (!booking) return null;

  const isEligibleToCancel = booking.canCancel;
  const isPaid = booking.payment.status === 'SUCCESSFUL' && booking.amount > 0;
  const isFree = booking.amount === 0;

  const finalReason = [
    selectedReasonChip && selectedReasonChip !== 'Other Reason' ? selectedReasonChip : null,
    customReason.trim() ? customReason.trim() : null,
  ]
    .filter(Boolean)
    .join(' — ') || (selectedReasonChip ? selectedReasonChip : undefined);

  const handleConfirmCancel = async () => {
    if (!isEligibleToCancel) {
      toast.error(
        booking.cancellationRestrictionReason ||
          'This booking is not eligible for cancellation under the 1-hour policy.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await cancelStudentBookingAction(booking.id, finalReason);

      if (!res.success) {
        toast.error(res.error || 'Failed to cancel reservation.');
        setIsSubmitting(false);
        return;
      }

      toast.success(res.message || 'Reservation cancelled successfully.');
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error cancelling booking.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg p-6 space-y-4">
        {/* Header with Alert / Danger Icon */}
        <DialogHeader className="space-y-1.5 text-left">
          <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Cancel Reservation
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Review cancellation policy and confirm release of your scheduled time slot.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Booking Summary Box */}
        <div className="p-3.5 bg-muted/40 rounded-xl border border-border/70 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-foreground">{booking.service.name}</span>
            <Badge variant="outline" className="font-mono text-[11px] px-2 py-0.5">
              {booking.bookingCode}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-muted-foreground pt-0.5">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              {booking.formattedDate}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              {booking.slotTime}
            </span>
          </div>

          <div className="text-[11px] text-muted-foreground flex items-center gap-1 pt-0.5">
            <span className="font-semibold text-foreground">Location:</span>
            <span>{booking.location}</span>
          </div>
        </div>

        {/* Cancellation Policy & Refund Terms Card */}
        <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <Info className="h-4 w-4 text-blue-500" />
            <span>Campus Cancellation Rules & Policy</span>
          </div>

          <ul className="space-y-1.5 text-[11px] text-muted-foreground">
            <li className="flex items-start gap-1.5">
              <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
              <span>
                <strong className="text-foreground">1-Hour Notice Window:</strong> Free cancellation is
                strictly permitted up to 1 hour prior to slot start time.
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
              <span>
                <strong className="text-foreground">Instant Slot Release:</strong> The reservation is voided
                and immediately returned to the campus availability pool for other students.
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
              <span>
                <strong className="text-foreground">Payment & Refund:</strong>{' '}
                {isPaid ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    100% full refund of ₹{booking.amount} will be automatically initiated to your original payment method.
                  </span>
                ) : isFree ? (
                  <span className="text-muted-foreground">
                    Complimentary campus pass. No monetary charges were deducted.
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">
                    Pending invoice will be voided with ₹0 charged.
                  </span>
                )}
              </span>
            </li>
          </ul>
        </div>

        {/* Warning if cancellation cutoff has passed */}
        {!isEligibleToCancel && (
          <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
            <div>
              <p className="font-bold">Cancellation Window Closed</p>
              <p className="text-[11px] mt-0.5">
                {booking.cancellationRestrictionReason ||
                  'Reservations must be cancelled at least 1 hour before scheduled start time. This booking can no longer be cancelled.'}
              </p>
            </div>
          </div>
        )}

        {/* Reason for Cancellation Input */}
        {isEligibleToCancel && (
          <div className="space-y-2.5 pt-1">
            <Label className="text-xs font-semibold text-foreground">
              Select reason for cancellation (optional):
            </Label>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5">
              {COMMON_CANCELLATION_REASONS.map((chip) => {
                const isSelected = selectedReasonChip === chip;
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() =>
                      setSelectedReasonChip(isSelected ? '' : chip)
                    }
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-all text-left ${
                      isSelected
                        ? 'border-rose-500 bg-rose-500/15 text-rose-700 dark:text-rose-300 font-semibold'
                        : 'border-border/70 bg-card hover:border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>

            {/* Additional details textarea */}
            <div className="space-y-1">
              <Label htmlFor="cancel-notes" className="text-[11px] text-muted-foreground">
                Additional comments or details:
              </Label>
              <Textarea
                id="cancel-notes"
                placeholder="Optional explanation for campus operations desk..."
                rows={2}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                disabled={isSubmitting}
                className="text-xs resize-none"
              />
            </div>
          </div>
        )}

        {/* Confirmation Footer */}
        <DialogFooter className="flex flex-col-reverse sm:flex-row items-center gap-2 sm:justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto text-xs"
          >
            Keep Reservation
          </Button>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleConfirmCancel}
            disabled={isSubmitting || !isEligibleToCancel}
            className="w-full sm:w-auto text-xs gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Cancelling & Releasing Slot...</span>
              </>
            ) : (
              <>
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Confirm Cancellation</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
