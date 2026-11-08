'use client';

import * as React from 'react';
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
  Mail,
  Phone,
  Check,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Loader2,
} from 'lucide-react';
import {
  type ProviderBookingItem,
  acceptBookingAction,
  startServiceBookingAction,
} from '@/app/actions/provider-booking-actions';
import { CompleteBookingDialog } from './complete-booking-dialog';
import { toast } from 'sonner';

interface ProviderBookingTableProps {
  bookings: ProviderBookingItem[];
  onReject: (booking: ProviderBookingItem) => void;
  onSuccess: () => void;
}

export function ProviderBookingTable({
  bookings,
  onReject,
  onSuccess,
}: ProviderBookingTableProps) {
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const [completingBooking, setCompletingBooking] = React.useState<ProviderBookingItem | null>(null);

  const handleAccept = async (b: ProviderBookingItem) => {
    setLoadingId(b.id);
    try {
      const res = await acceptBookingAction(b.id);
      if (!res.success) {
        toast.error(res.error || 'Failed to accept booking.');
        setLoadingId(null);
        return;
      }
      toast.success(res.message || 'Booking accepted!');
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error accepting booking';
      toast.error(msg);
    } finally {
      setLoadingId(null);
    }
  };

  const handleStart = async (b: ProviderBookingItem) => {
    setLoadingId(b.id);
    try {
      const res = await startServiceBookingAction(b.id);
      if (!res.success) {
        toast.error(res.error || 'Failed to start service.');
        setLoadingId(null);
        return;
      }
      toast.success(res.message || 'Service marked In Progress.');
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error starting service';
      toast.error(msg);
    } finally {
      setLoadingId(null);
    }
  };

  const handleComplete = (b: ProviderBookingItem) => {
    setCompletingBooking(b);
  };

  const getStatusBadge = (b: ProviderBookingItem) => {
    switch (b.status) {
      case 'COMPLETED':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs font-semibold">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 text-xs font-semibold">
            <Sparkles className="h-3 w-3 mr-1 animate-pulse" />
            In Progress
          </Badge>
        );
      case 'CONFIRMED':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs font-semibold">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Confirmed
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
            Pending Request
          </Badge>
        );
    }
  };

  const getPaymentBadge = (b: ProviderBookingItem) => {
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
            <TableHead className="font-semibold text-xs text-foreground">Student</TableHead>
            <TableHead className="font-semibold text-xs text-foreground">Service & Location</TableHead>
            <TableHead className="font-semibold text-xs text-foreground">Schedule</TableHead>
            <TableHead className="font-semibold text-xs text-foreground">Amount & Payment</TableHead>
            <TableHead className="font-semibold text-xs text-foreground">Booking Status</TableHead>
            <TableHead className="font-semibold text-xs text-foreground text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {bookings.map((b) => {
            const isLoading = loadingId === b.id;

            return (
              <TableRow key={b.id} className="hover:bg-muted/30 transition-colors">
                {/* Token Code */}
                <TableCell className="font-mono text-xs font-bold text-foreground">
                  <div className="flex items-center gap-1.5">
                    <Ticket className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{b.bookingCode}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-sans block mt-0.5">
                    Req: {b.formattedCreatedAt}
                  </span>
                </TableCell>

                {/* Student */}
                <TableCell>
                  <div className="flex flex-col text-xs">
                    <span className="font-bold text-foreground">{b.student.name}</span>
                    <span className="text-muted-foreground flex items-center gap-1 mt-0.5 truncate max-w-[170px]">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{b.student.email}</span>
                    </span>
                    {b.student.phone && (
                      <span className="text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3 shrink-0" />
                        <span>{b.student.phone}</span>
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Service & Location */}
                <TableCell>
                  <div className="flex flex-col text-xs">
                    <span className="font-semibold text-foreground">{b.service.name}</span>
                    <span className="text-primary text-[11px] font-medium">{b.service.categoryName}</span>
                    <span className="text-muted-foreground flex items-center gap-1 mt-0.5 truncate max-w-[160px]">
                      <MapPin className="h-3 w-3 shrink-0 text-primary" />
                      <span className="truncate">{b.location}</span>
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
                      {b.slotTime} ({b.service.durationMinutes}m)
                    </span>
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
                  <div className="flex items-center justify-end gap-1.5 flex-wrap">
                    {/* Action: Accept */}
                    {b.canAccept && (
                      <Button
                        size="sm"
                        onClick={() => handleAccept(b)}
                        disabled={isLoading}
                        className="h-8 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {isLoading ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3 mr-1" />
                        )}
                        Accept
                      </Button>
                    )}

                    {/* Action: Start Service */}
                    {b.canStart && (
                      <Button
                        size="sm"
                        onClick={() => handleStart(b)}
                        disabled={isLoading}
                        className="h-8 text-xs px-2.5 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isLoading ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Play className="h-3 w-3 mr-1" />
                        )}
                        Start
                      </Button>
                    )}

                    {/* Action: Mark Completed */}
                    {b.canComplete && (
                      <Button
                        size="sm"
                        onClick={() => handleComplete(b)}
                        className="h-8 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Complete
                      </Button>
                    )}

                    {/* Action: Reject */}
                    {b.canReject && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onReject(b)}
                        disabled={isLoading}
                        className="h-8 text-xs px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Decline Booking"
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Reject
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <CompleteBookingDialog
        booking={completingBooking}
        open={Boolean(completingBooking)}
        onOpenChange={(open) => !open && setCompletingBooking(null)}
        onSuccess={onSuccess}
      />
    </div>
  );
}

