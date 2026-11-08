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
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  CreditCard,
  Printer,
  Copy,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { type StudentBookingItem } from '@/app/actions/booking-actions';
import { toast } from 'sonner';

interface BookingPassDialogProps {
  booking: StudentBookingItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingPassDialog({
  booking,
  open,
  onOpenChange,
}: BookingPassDialogProps) {
  const [copied, setCopied] = React.useState(false);

  if (!booking) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(booking.bookingCode);
    setCopied(true);
    toast.success('Token code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const isConfirmed = booking.status === 'CONFIRMED';
  const isCompleted = booking.status === 'COMPLETED';
  const isCancelled = booking.status === 'CANCELLED' || booking.status === 'REJECTED';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-border/80 shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Campus Reservation Pass - {booking.bookingCode}</DialogTitle>
          <DialogDescription>
            Digital pass and token for {booking.service.name}
          </DialogDescription>
        </DialogHeader>

        {/* Pass Header Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none" />

          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline" className="border-white/30 bg-white/10 text-white backdrop-blur-sm text-xs font-medium">
              <ShieldCheck className="h-3 w-3 mr-1 text-emerald-300" />
              Official Campus Pass
            </Badge>

            <Badge
              className={
                isConfirmed
                  ? 'bg-emerald-500/90 text-white font-medium'
                  : isCompleted
                  ? 'bg-blue-400/90 text-white font-medium'
                  : isCancelled
                  ? 'bg-rose-500/90 text-white font-medium'
                  : 'bg-amber-400/90 text-amber-950 font-medium'
              }
            >
              {booking.status}
            </Badge>
          </div>

          <div className="flex flex-col items-center justify-center my-1">
            <span className="text-xs uppercase tracking-widest text-blue-100 font-semibold mb-1">
              Reservation Token
            </span>
            <div className="flex items-center gap-2 bg-white/15 px-4 py-2 rounded-xl backdrop-blur-md border border-white/20">
              <span className="font-mono text-2xl font-bold tracking-wider text-white">
                {booking.bookingCode}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={handleCopyCode}
                title="Copy token code"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <p className="text-xs text-blue-100 mt-3 font-medium">
            Present this digital token at the service location during check-in.
          </p>
        </div>

        {/* Pass Body Content */}
        <div className="p-6 space-y-5 bg-card">
          {/* Service & Provider */}
          <div className="flex items-start justify-between border-b pb-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {booking.service.category?.name || 'Campus Facility'}
              </span>
              <h3 className="text-lg font-bold text-foreground leading-tight">
                {booking.service.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                Managed by {booking.provider.name}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-muted-foreground">Amount</span>
              <p className="text-xl font-bold text-foreground">
                {booking.amount === 0 ? 'FREE' : `₹${booking.amount}`}
              </p>
            </div>
          </div>

          {/* Schedule Details Grid */}
          <div className="grid grid-cols-2 gap-3.5 bg-muted/40 p-4 rounded-xl border border-border/50 text-sm">
            <div className="flex items-start gap-2.5">
              <Calendar className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-muted-foreground block font-medium">Scheduled Date</span>
                <span className="font-semibold text-foreground text-xs sm:text-sm">
                  {booking.formattedDate}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-muted-foreground block font-medium">Time Slot</span>
                <span className="font-semibold text-foreground text-xs sm:text-sm">
                  {booking.slotTime}
                </span>
              </div>
            </div>

            <div className="col-span-2 flex items-start gap-2.5 pt-2 border-t border-border/40">
              <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-muted-foreground block font-medium">Location</span>
                <span className="font-semibold text-foreground text-xs sm:text-sm">
                  {booking.location}
                </span>
              </div>
            </div>
          </div>

          {/* Payment & Audit Info */}
          <div className="rounded-xl border border-border/60 p-4 space-y-3 bg-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-primary" />
                Payment Record
              </span>
              <Badge
                variant="outline"
                className={
                  booking.payment.status === 'SUCCESSFUL' || booking.payment.status === 'FREE_PASS'
                    ? 'border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : booking.payment.status === 'PENDING'
                    ? 'border-amber-500/40 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                    : 'border-rose-500/40 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                }
              >
                {booking.payment.status === 'FREE_PASS' ? 'Free Campus Grant' : booking.payment.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground block">Method:</span>
                <span className="font-medium text-foreground">
                  {booking.amount === 0 ? 'Campus Waiver' : booking.payment.method || 'Razorpay Online'}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block">Booked On:</span>
                <span className="font-medium text-foreground">{booking.formattedCreatedAt}</span>
              </div>

              {booking.payment.transactionId && (
                <div className="col-span-2 truncate">
                  <span className="text-muted-foreground block">Transaction ID:</span>
                  <span className="font-mono text-xs text-foreground font-medium truncate block">
                    {booking.payment.transactionId}
                  </span>
                </div>
              )}

              {booking.payment.orderId && (
                <div className="col-span-2 truncate">
                  <span className="text-muted-foreground block">Razorpay Order ID:</span>
                  <span className="font-mono text-xs text-foreground font-medium truncate block">
                    {booking.payment.orderId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {booking.notes && (
            <div className="text-xs p-3 bg-muted/30 rounded-lg border border-border/40">
              <span className="font-semibold text-muted-foreground block mb-0.5">Booking Notes:</span>
              <p className="text-foreground italic">{booking.notes}</p>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <DialogFooter className="p-4 bg-muted/20 border-t flex items-center justify-between sm:justify-between">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1.5" />
              Print Pass
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
