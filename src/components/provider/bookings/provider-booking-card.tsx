'use client';

import * as React from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  Play,
  Check,
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

interface ProviderBookingCardProps {
  booking: ProviderBookingItem;
  onReject: (booking: ProviderBookingItem) => void;
  onSuccess: () => void;
}

export function ProviderBookingCard({
  booking,
  onReject,
  onSuccess,
}: ProviderBookingCardProps) {
  const [isAccepting, setIsAccepting] = React.useState(false);
  const [isStarting, setIsStarting] = React.useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = React.useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const res = await acceptBookingAction(booking.id);
      if (!res.success) {
        toast.error(res.error || 'Failed to accept booking.');
        setIsAccepting(false);
        return;
      }
      toast.success(res.message || 'Booking accepted!');
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error accepting booking';
      toast.error(msg);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleStart = async () => {
    setIsStarting(true);
    try {
      const res = await startServiceBookingAction(booking.id);
      if (!res.success) {
        toast.error(res.error || 'Failed to start service.');
        setIsStarting(false);
        return;
      }
      toast.success(res.message || 'Service marked In Progress.');
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error starting service';
      toast.error(msg);
    } finally {
      setIsStarting(false);
    }
  };

  const handleComplete = () => {
    setShowCompleteDialog(true);
  };

  const isCompleted = booking.status === 'COMPLETED';
  const isInProgress = booking.status === 'IN_PROGRESS';
  const isConfirmed = booking.status === 'CONFIRMED';
  const isCancelled = booking.status === 'CANCELLED' || booking.status === 'REJECTED';

  const getStatusBadge = () => {
    if (isCompleted) {
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs font-semibold">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Completed
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
    if (isConfirmed) {
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs font-semibold">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Confirmed
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
        Pending Request
      </Badge>
    );
  };

  const getPaymentBadge = () => {
    switch (booking.payment.status) {
      case 'FREE_PASS':
        return (
          <Badge variant="outline" className="bg-emerald-50/60 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 text-[11px]">
            Free Pass
          </Badge>
        );
      case 'SUCCESSFUL':
        return (
          <Badge variant="outline" className="bg-emerald-50/60 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 text-[11px]">
            Paid
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="outline" className="bg-amber-50/60 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 text-[11px]">
            Unpaid
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge variant="outline" className="bg-rose-50/60 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 text-[11px]">
            Payment Failed
          </Badge>
        );
      case 'REFUNDED':
        return (
          <Badge variant="outline" className="bg-purple-50/60 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-400 text-[11px]">
            Refunded
          </Badge>
        );
    }
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden border-border/80 shadow-sm hover:border-primary/40 transition-all">
      {/* Top Header */}
      <CardHeader className="p-4 pb-3 border-b bg-muted/20">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-foreground">
            <Ticket className="h-3.5 w-3.5 text-primary" />
            <span>{booking.bookingCode}</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {getPaymentBadge()}
            {getStatusBadge()}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-1 space-y-4 text-xs">
        {/* Student Info Box */}
        <div className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/50">
          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
            {booking.student.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground truncate">{booking.student.name}</span>
              <Badge variant="secondary" className="text-[10px] py-0 px-1 font-medium">
                Student
              </Badge>
            </div>
            <div className="text-muted-foreground truncate flex items-center gap-1 mt-0.5">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{booking.student.email}</span>
            </div>
            {booking.student.phone && (
              <div className="text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                <Phone className="h-3 w-3 shrink-0" />
                <span>{booking.student.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Service & Price Info */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
              {booking.service.categoryName}
            </span>
            <span className="text-sm font-bold text-foreground">
              {booking.amount === 0 ? 'FREE' : `₹${booking.amount}`}
            </span>
          </div>
          <h4 className="font-bold text-sm text-foreground mt-0.5 leading-snug">
            {booking.service.name}
          </h4>
        </div>

        {/* Schedule & Location */}
        <div className="bg-muted/40 p-2.5 rounded-lg space-y-1.5 border border-border/40 text-muted-foreground">
          <div className="flex items-center justify-between text-foreground font-medium">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              {booking.formattedDate}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              {booking.slotTime}
            </span>
          </div>

          <div className="flex items-center gap-1.5 pt-1 border-t border-border/40">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate">{booking.location}</span>
          </div>
        </div>

        {/* Notes if any */}
        {booking.notes && (
          <p className="text-[11px] text-muted-foreground italic truncate">
            &ldquo;{booking.notes}&rdquo;
          </p>
        )}
      </CardContent>

      {/* Action Footer */}
      <CardFooter className="p-4 pt-0 gap-2 flex-wrap">
        {booking.canAccept && (
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={isAccepting}
            className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isAccepting ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5 mr-1" />
            )}
            Accept
          </Button>
        )}

        {booking.canStart && (
          <Button
            size="sm"
            onClick={handleStart}
            disabled={isStarting}
            className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isStarting ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5 mr-1" />
            )}
            Start Service
          </Button>
        )}

        {booking.canComplete && (
          <Button
            size="sm"
            onClick={handleComplete}
            className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            Mark Completed
          </Button>
        )}

        {booking.canReject && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReject(booking)}
            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            <XCircle className="h-3.5 w-3.5 mr-1" />
            Reject
          </Button>
        )}
      </CardFooter>

      <CompleteBookingDialog
        booking={booking}
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
        onSuccess={onSuccess}
      />
    </Card>
  );
}
