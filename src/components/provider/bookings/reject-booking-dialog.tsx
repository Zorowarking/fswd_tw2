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
import { XCircle, Loader2, Calendar, Clock } from 'lucide-react';
import { rejectBookingAction, type ProviderBookingItem } from '@/app/actions/provider-booking-actions';
import { toast } from 'sonner';

interface RejectBookingDialogProps {
  booking: ProviderBookingItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const COMMON_REASONS = [
  'Equipment maintenance / facility repair',
  'Capacity overbooked during this time window',
  'Staff / operator unavailable',
  'Emergency campus closure or restricted access',
];

export function RejectBookingDialog({
  booking,
  open,
  onOpenChange,
  onSuccess,
}: RejectBookingDialogProps) {
  const [reason, setReason] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!booking) return null;

  const handleConfirmReject = async () => {
    setIsSubmitting(true);
    try {
      const res = await rejectBookingAction(booking.id, reason.trim() || undefined);

      if (!res.success) {
        toast.error(res.error || 'Failed to decline booking request.');
        setIsSubmitting(false);
        return;
      }

      toast.success(res.message || 'Booking request declined.');
      setReason('');
      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error declining booking.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <XCircle className="h-5 w-5" />
            <DialogTitle>Decline Booking Request</DialogTitle>
          </div>
          <DialogDescription>
            Decline reservation token <strong className="text-foreground">{booking.bookingCode}</strong> for student{' '}
            <strong className="text-foreground">{booking.student.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        {/* Booking Summary Mini-box */}
        <div className="p-3 bg-muted/40 rounded-lg border border-border/60 text-xs space-y-1.5 my-1">
          <div className="flex items-center justify-between font-semibold text-foreground">
            <span>{booking.service.name}</span>
            <span className="font-mono">{booking.bookingCode}</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              {booking.formattedDate}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-primary" />
              {booking.slotTime}
            </span>
          </div>
        </div>

        {/* Quick Reasons Chips */}
        <div className="space-y-1.5 py-1">
          <Label className="text-xs font-semibold text-foreground">
            Common reasons (select to autofill):
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className="text-[11px] px-2 py-1 bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground rounded-md border border-border/60 transition-colors text-left"
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Reason Textarea */}
        <div className="space-y-1.5 py-1">
          <Label htmlFor="reject-reason" className="text-xs font-semibold text-foreground">
            Decline Reason / Explanation
          </Label>
          <Textarea
            id="reject-reason"
            placeholder="Explain why this reservation is being declined..."
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isSubmitting}
            className="text-xs resize-none"
          />
        </div>

        <DialogFooter className="flex items-center gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Keep Booking
          </Button>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleConfirmReject}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Declining...
              </>
            ) : (
              'Confirm Decline'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
