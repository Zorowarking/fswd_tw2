'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  Ticket,
  CreditCard,
  XCircle,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { type StudentBookingItem } from '@/app/actions/booking-actions';

interface BookingCardProps {
  booking: StudentBookingItem;
  onViewPass: (booking: StudentBookingItem) => void;
  onCancel: (booking: StudentBookingItem) => void;
}

export function BookingCard({
  booking,
  onViewPass,
  onCancel,
}: BookingCardProps) {
  const isConfirmed = booking.status === 'CONFIRMED';
  const isCompleted = booking.status === 'COMPLETED';
  const isCancelled = booking.status === 'CANCELLED' || booking.status === 'REJECTED';
  const isInProgress = booking.status === 'IN_PROGRESS';

  const getStatusBadge = () => {
    if (isConfirmed) {
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs font-semibold">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Confirmed
        </Badge>
      );
    }
    if (isInProgress) {
      return (
        <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 text-xs font-semibold">
          <Sparkles className="h-3 w-3 mr-1 animate-pulse" />
          In Progress
        </Badge>
      );
    }
    if (isCompleted) {
      return (
        <Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30 text-xs font-semibold">
          Completed
        </Badge>
      );
    }
    if (isCancelled) {
      return (
        <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 text-xs font-semibold">
          <XCircle className="h-3 w-3 mr-1" />
          {booking.status === 'REJECTED' ? 'Rejected' : 'Cancelled'}
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-xs font-semibold">
        <AlertCircle className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  const getPaymentBadge = () => {
    switch (booking.payment.status) {
      case 'FREE_PASS':
        return (
          <Badge variant="outline" className="text-[11px] font-medium bg-emerald-50/50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-400">
            Free Pass
          </Badge>
        );
      case 'SUCCESSFUL':
        return (
          <Badge variant="outline" className="text-[11px] font-medium bg-emerald-50/50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-400">
            Paid
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="outline" className="text-[11px] font-medium bg-amber-50/50 text-amber-700 border-amber-300 dark:bg-amber-950/30 dark:text-amber-400">
            Unpaid
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge variant="outline" className="text-[11px] font-medium bg-rose-50/50 text-rose-700 border-rose-300 dark:bg-rose-950/30 dark:text-rose-400">
            Payment Failed
          </Badge>
        );
      case 'REFUNDED':
        return (
          <Badge variant="outline" className="text-[11px] font-medium bg-purple-50/50 text-purple-700 border-purple-300 dark:bg-purple-950/30 dark:text-purple-400">
            Refunded
          </Badge>
        );
    }
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden border-border/70 hover:border-primary/40 hover:shadow-md transition-all duration-200">
      {/* Top Banner: Token Code & Badges */}
      <CardHeader className="p-4 pb-3 border-b bg-muted/20">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Ticket className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono text-xs font-bold tracking-wider text-foreground">
              {booking.bookingCode}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {getPaymentBadge()}
            {getStatusBadge()}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-1 space-y-4">
        {/* Service Details */}
        <div className="flex items-start gap-3">
          {booking.service.imageUrl ? (
            <div className="relative h-12 w-12 rounded-lg overflow-hidden shrink-0 border border-border/50 bg-muted">
              <Image
                src={booking.service.imageUrl}
                alt={booking.service.name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="h-12 w-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Building2 className="h-6 w-6" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-semibold text-primary uppercase tracking-wider truncate">
                {booking.service.category?.name || 'Campus Service'}
              </span>
              <span className="text-sm font-bold text-foreground shrink-0">
                {booking.amount === 0 ? 'FREE' : `₹${booking.amount}`}
              </span>
            </div>

            <Link
              href={`/student/services/${booking.service.id}`}
              className="font-bold text-sm text-foreground hover:text-primary transition-colors line-clamp-1 group flex items-center gap-1"
            >
              <span className="truncate">{booking.service.name}</span>
              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </Link>

            <p className="text-xs text-muted-foreground truncate mt-0.5">
              Provider: {booking.provider.name}
            </p>
          </div>
        </div>

        {/* Schedule & Location Box */}
        <div className="bg-muted/40 rounded-lg p-2.5 space-y-1.5 text-xs border border-border/40">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5 text-foreground font-medium">
              <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
              {booking.formattedDate}
            </span>
            <span className="flex items-center gap-1.5 text-foreground font-medium">
              <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
              {booking.slotTime}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-muted-foreground pt-1 border-t border-border/30">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate">{booking.location}</span>
          </div>
        </div>

        {booking.notes && (
          <p className="text-[11px] text-muted-foreground italic truncate">
            &ldquo;{booking.notes}&rdquo;
          </p>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 gap-2 flex-wrap">
        <Button
          asChild
          variant="default"
          size="sm"
          className="flex-1 text-xs"
        >
          <Link href={`/student/bookings/${booking.id}`}>
            <Clock className="h-3.5 w-3.5 mr-1" />
            Track
          </Link>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs"
          onClick={() => onViewPass(booking)}
        >
          <Ticket className="h-3.5 w-3.5 mr-1 text-primary" />
          Pass
        </Button>

        {booking.canPay && (
          <Button
            asChild
            size="sm"
            className="flex-1 text-xs bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Link
              href={`/student/services/${booking.service.id}/review?date=${
                booking.scheduledAt.split('T')[0]
              }&slot=${encodeURIComponent(booking.slotTime)}`}
            >
              <CreditCard className="h-3.5 w-3.5 mr-1" />
              Pay Now
            </Link>
          </Button>
        )}

        {booking.canCancel && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            onClick={() => onCancel(booking)}
          >
            <XCircle className="h-3.5 w-3.5 mr-1" />
            Cancel
          </Button>
        )}

        {!booking.canCancel && (booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
          <div
            className="flex items-center gap-1 text-[11px] text-muted-foreground px-2 py-1 rounded-md bg-muted/40 border border-border/50"
            title={booking.cancellationRestrictionReason || 'Cancellation window closed (within 1 hr of slot)'}
          >
            <Clock className="h-3 w-3 text-amber-500 shrink-0" />
            <span>Locked (&lt;1h)</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
