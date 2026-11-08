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
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Clock, Calendar, User, Ticket } from 'lucide-react';
import { completeServiceBookingAction, type ProviderBookingItem } from '@/app/actions/provider-booking-actions';
import { toast } from 'sonner';

interface CompleteBookingDialogProps {
  booking: ProviderBookingItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CompleteBookingDialog({
  booking,
  open,
  onOpenChange,
  onSuccess,
}: CompleteBookingDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!booking) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const res = await completeServiceBookingAction(booking.id);
      if (!res.success) {
        toast.error(res.error || 'Failed to complete service.');
        setIsSubmitting(false);
        return;
      }
      toast.success(res.message || 'Service marked Completed! Student notified.');
      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error completing service';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent className="max-w-md p-6 space-y-4 rounded-2xl border-border/80 shadow-2xl">
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Confirm Service Completion
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Verify service delivery before marking this reservation completed.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Booking summary snapshot */}
        <div className="p-4 rounded-xl border border-border/60 bg-muted/30 space-y-2.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <span className="font-mono font-bold text-foreground flex items-center gap-1.5">
              <Ticket className="h-3.5 w-3.5 text-primary" />
              {booking.bookingCode}
            </span>
            <Badge variant="outline" className="text-[10px] bg-background">
              {booking.service.name}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-foreground/70" />
              <span className="truncate">{booking.student.name || booking.student.email}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-foreground/70" />
              <span>{booking.formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-foreground/70" />
              <span>{booking.slotTime}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground">₹{booking.amount}</span>
              <span className="text-[10px]">({booking.payment.status})</span>
            </div>
          </div>
        </div>

        {/* Reassurance note */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-400 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            Once marked complete, the student will immediately receive a notification to rate and review this session. This status transition is final.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/50">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs rounded-xl"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            isLoading={isSubmitting}
            disabled={isSubmitting}
            className="text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
          >
            Yes, Mark Completed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
