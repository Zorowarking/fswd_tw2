'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Ticket,
  Copy,
  Check,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Building2,
  Printer,
  ArrowRight,
  ShieldCheck,
  User,
} from 'lucide-react';
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
import type { BookingResponseData } from '@/app/actions/booking-actions';
import { toast } from 'sonner';

interface BookingConfirmedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingResponseData | null;
  onBookAnother?: () => void;
}

export function BookingConfirmedDialog({
  open,
  onOpenChange,
  booking,
  onBookAnother,
}: BookingConfirmedDialogProps) {
  const [copied, setCopied] = React.useState(false);

  if (!booking) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(booking.bookingCode);
      setCopied(true);
      toast.success('Booking code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy code.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const scheduledDateObj = new Date(booking.scheduledAt);
  const formattedScheduledDate = scheduledDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const createdDateObj = new Date(booking.createdAt);
  const formattedCreatedAt = createdDateObj.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 mb-2 ring-8 ring-emerald-500/5">
            <CheckCircle2 className="h-8 w-8 stroke-[2.5]" />
          </div>
          <DialogTitle className="text-2xl font-black text-foreground">
            Booking Confirmed!
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Your university service reservation has been validated and issued by campus operations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Digital Token Slip */}
          <div className="rounded-3xl border-2 border-dashed border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-card to-blue-500/5 p-5 space-y-4 shadow-sm">
            {/* Header: Token Code + Copy Button */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Ticket className="h-3.5 w-3.5 text-emerald-500" />
                  Official Booking Code
                </span>
                <p className="text-2xl font-black font-mono tracking-tight text-foreground mt-0.5">
                  {booking.bookingCode}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCode}
                  className="h-8 text-xs gap-1.5 rounded-xl border-border/80"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-emerald-500 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Copy Code</span>
                    </>
                  )}
                </Button>

                <Badge variant="glow" className="text-xs bg-emerald-500/15 text-emerald-500 border-emerald-500/30">
                  {booking.status}
                </Badge>
              </div>
            </div>

            {/* Structured Booking Details */}
            <div className="space-y-2.5">
              {/* Service */}
              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  Service:
                </span>
                <strong className="text-foreground text-right">{booking.service.name}</strong>
              </div>

              {/* Provider */}
              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  Provider Desk:
                </span>
                <span className="text-foreground font-medium text-right">
                  {booking.provider.name}
                </span>
              </div>

              {/* Student */}
              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  Student:
                </span>
                <span className="text-foreground font-medium text-right">
                  {booking.student.name} ({booking.student.email})
                </span>
              </div>

              {/* Date */}
              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground flex items-center gap-1">
                  <CalendarIcon className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  Scheduled Date:
                </span>
                <strong className="text-foreground text-right">{formattedScheduledDate}</strong>
              </div>

              {/* Time Window */}
              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  Time Window:
                </span>
                <strong className="font-mono text-foreground text-right">{booking.slotTime}</strong>
              </div>

              {/* Location */}
              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                  Location:
                </span>
                <span className="text-foreground font-medium text-right max-w-[240px] truncate">
                  {booking.location}
                </span>
              </div>

              {/* Amount */}
              <div className="flex items-start justify-between gap-2 border-t border-border/60 pt-2 font-bold">
                <span className="text-foreground">Amount Paid / Subsidized:</span>
                <span className="font-mono text-sm text-blue-600 dark:text-blue-400">
                  {booking.amount === 0 ? 'FREE (Campus Subsidized)' : `₹${booking.amount}`}
                </span>
              </div>

              {/* Created At */}
              <div className="flex items-start justify-between gap-2 text-[10px] text-muted-foreground">
                <span>Created At:</span>
                <span className="font-mono">{formattedCreatedAt}</span>
              </div>
            </div>

            {/* Notes if present */}
            {booking.notes && (
              <div className="rounded-xl border border-border/60 bg-background/50 p-2.5 text-[11px]">
                <span className="text-muted-foreground font-semibold">Special Instructions: </span>
                <span className="text-foreground">{booking.notes}</span>
              </div>
            )}
          </div>

          {/* Reporting notice */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-[11px] text-muted-foreground leading-relaxed">
            <strong className="text-foreground block mb-0.5">Campus Facility Reporting:</strong>
            Show your booking code <strong>{booking.bookingCode}</strong> or digital campus ID card
            to the facility attendant upon arrival.
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs flex-1 sm:flex-initial"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              Print Pass
            </Button>
            {onBookAnother && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onBookAnother}
                className="text-xs flex-1 sm:flex-initial text-muted-foreground"
              >
                Book Another Slot
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link href="/student/bookings" className="w-full sm:w-auto">
              <Button
                size="sm"
                variant="gradient"
                className="text-xs w-full font-bold shadow-md shadow-blue-500/20"
              >
                <span>View in My Bookings</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
