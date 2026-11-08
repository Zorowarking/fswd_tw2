'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Sparkles,
  CreditCard,
} from 'lucide-react';
import { type StudentBookingItem } from '@/app/actions/booking-actions';

interface BookingTableProps {
  bookings: StudentBookingItem[];
  onViewPass: (booking: StudentBookingItem) => void;
  onCancel: (booking: StudentBookingItem) => void;
}

export function BookingTable({
  bookings,
  onViewPass,
  onCancel,
}: BookingTableProps) {
  const getStatusBadge = (b: StudentBookingItem) => {
    switch (b.status) {
      case 'CONFIRMED':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs font-semibold">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Confirmed
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 text-xs font-semibold">
            <Sparkles className="h-3 w-3 mr-1 animate-pulse" />
            In Progress
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30 text-xs font-semibold">
            Completed
          </Badge>
        );
      case 'CANCELLED':
      case 'REJECTED':
        return (
          <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 text-xs font-semibold">
            <XCircle className="h-3 w-3 mr-1" />
            {b.status === 'REJECTED' ? 'Rejected' : 'Cancelled'}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-xs font-semibold">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const getPaymentBadge = (b: StudentBookingItem) => {
    switch (b.payment.status) {
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
            Failed
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
    <div className="rounded-xl border border-border/80 overflow-hidden bg-card shadow-sm">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-semibold text-xs text-foreground">Token Code</TableHead>
            <TableHead className="font-semibold text-xs text-foreground">Service & Provider</TableHead>
            <TableHead className="font-semibold text-xs text-foreground">Schedule</TableHead>
            <TableHead className="font-semibold text-xs text-foreground">Location</TableHead>
            <TableHead className="font-semibold text-xs text-foreground">Amount & Payment</TableHead>
            <TableHead className="font-semibold text-xs text-foreground">Booking Status</TableHead>
            <TableHead className="font-semibold text-xs text-foreground text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {bookings.map((b) => (
            <TableRow key={b.id} className="hover:bg-muted/30 transition-colors">
              {/* Token Code */}
              <TableCell className="font-mono text-xs font-bold text-foreground">
                <div className="flex items-center gap-1.5">
                  <Ticket className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>{b.bookingCode}</span>
                </div>
              </TableCell>

              {/* Service & Provider */}
              <TableCell>
                <div className="flex flex-col">
                  <Link
                    href={`/student/services/${b.service.id}`}
                    className="font-semibold text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1 group"
                  >
                    <span>{b.service.name}</span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {b.service.category?.name || 'Campus Service'} • By {b.provider.name}
                  </span>
                </div>
              </TableCell>

              {/* Schedule */}
              <TableCell>
                <div className="flex flex-col text-xs text-muted-foreground">
                  <span className="font-medium text-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-primary shrink-0" />
                    {b.formattedDate}
                  </span>
                  <span className="flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3 text-primary shrink-0" />
                    {b.slotTime}
                  </span>
                </div>
              </TableCell>

              {/* Location */}
              <TableCell className="text-xs text-muted-foreground">
                <div className="flex items-center gap-1 max-w-[180px] truncate" title={b.location}>
                  <MapPin className="h-3 w-3 text-primary shrink-0" />
                  <span className="truncate">{b.location}</span>
                </div>
              </TableCell>

              {/* Amount & Payment */}
              <TableCell>
                <div className="flex flex-col gap-1 items-start">
                  <span className="font-bold text-sm text-foreground">
                    {b.amount === 0 ? 'FREE' : `₹${b.amount}`}
                  </span>
                  {getPaymentBadge(b)}
                </div>
              </TableCell>

              {/* Booking Status */}
              <TableCell>{getStatusBadge(b)}</TableCell>

              {/* Actions */}
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <Button
                    asChild
                    size="sm"
                    className="h-8 text-xs px-2.5"
                  >
                    <Link href={`/student/bookings/${b.id}`}>
                      <Clock className="h-3 w-3 mr-1" />
                      Track
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs px-2.5"
                    onClick={() => onViewPass(b)}
                  >
                    <Ticket className="h-3 w-3 mr-1 text-primary" />
                    Pass
                  </Button>

                  {b.canPay && (
                    <Button
                      asChild
                      size="sm"
                      className="h-8 text-xs px-2.5 bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      <Link
                        href={`/student/services/${b.service.id}/review?date=${
                          b.scheduledAt.split('T')[0]
                        }&slot=${encodeURIComponent(b.slotTime)}`}
                      >
                        <CreditCard className="h-3 w-3 mr-1" />
                        Pay
                      </Link>
                    </Button>
                  )}

                  {b.canCancel && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      onClick={() => onCancel(b)}
                      title="Cancel Booking"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  )}

                  {!b.canCancel && (b.status === 'PENDING' || b.status === 'CONFIRMED') && (
                    <span
                      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground px-2 py-1 rounded bg-muted/40 border border-border/50"
                      title={b.cancellationRestrictionReason || 'Cancellation window closed (within 1 hr of slot)'}
                    >
                      <Clock className="h-3 w-3 text-amber-500" />
                      <span>&lt;1h</span>
                    </span>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

