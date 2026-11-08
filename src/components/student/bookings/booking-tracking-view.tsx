'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Ticket,
  Calendar,
  Clock,
  MapPin,
  Building2,
  CreditCard,
  Printer,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Sparkles,
  ExternalLink,
  Phone,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { type BookingTrackingDetails } from '@/app/actions/booking-actions';
import { BookingTimeline } from './booking-timeline';
import { BookingFeedbackCard } from './booking-feedback-card';
import { CancelBookingDialog } from './cancel-booking-dialog';
import { toast } from 'sonner';

interface BookingTrackingViewProps {
  booking: BookingTrackingDetails;
}

export function BookingTrackingView({ booking }: BookingTrackingViewProps) {
  const router = useRouter();
  const [copied, setCopied] = React.useState(false);
  const [showCancelDialog, setShowCancelDialog] = React.useState(false);

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
  const isInProgress = booking.status === 'IN_PROGRESS';
  const isCompleted = booking.status === 'COMPLETED';
  const isCancelled = booking.isCancelled;

  const getStatusBadge = () => {
    if (isCompleted) {
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs font-semibold">
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
          Completed
        </Badge>
      );
    }
    if (isInProgress) {
      return (
        <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5 mr-1 animate-pulse" />
          Active In Progress
        </Badge>
      );
    }
    if (isConfirmed) {
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs font-semibold">
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
          Confirmed
        </Badge>
      );
    }
    if (isCancelled) {
      return (
        <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 text-xs font-semibold">
          <XCircle className="h-3.5 w-3.5 mr-1" />
          {booking.status === 'REJECTED' ? 'Declined by Provider' : 'Cancelled'}
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-xs font-semibold">
        <AlertCircle className="h-3.5 w-3.5 mr-1" />
        Pending Confirmation
      </Badge>
    );
  };

  const getPaymentBadge = () => {
    switch (booking.payment.status) {
      case 'FREE_PASS':
        return (
          <Badge variant="outline" className="bg-emerald-50/60 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 text-xs">
            Free Campus Grant
          </Badge>
        );
      case 'SUCCESSFUL':
        return (
          <Badge variant="outline" className="bg-emerald-50/60 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 text-xs">
            Payment Paid
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="outline" className="bg-amber-50/60 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 text-xs">
            Unpaid / Pending
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge variant="outline" className="bg-rose-50/60 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 text-xs">
            Payment Failed
          </Badge>
        );
      case 'REFUNDED':
        return (
          <Badge variant="outline" className="bg-purple-50/60 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-400 text-xs">
            Refunded
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/student/bookings"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to All Bookings
          </Link>

          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {booking.service.name}
            </h1>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              {getPaymentBadge()}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">Token Code:</span>
            <div className="inline-flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-md border text-xs font-mono font-bold text-foreground">
              <Ticket className="h-3.5 w-3.5 text-primary" />
              <span>{booking.bookingCode}</span>
              <button
                onClick={handleCopyCode}
                className="text-muted-foreground hover:text-foreground ml-1"
                title="Copy token code"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:self-start">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs h-9"
          >
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            Print Pass
          </Button>

          {booking.canPay && (
            <Button
              asChild
              size="sm"
              className="text-xs h-9 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Link
                href={`/student/services/${booking.service.id}/review?date=${
                  booking.scheduledAt.split('T')[0]
                }&slot=${encodeURIComponent(booking.slotTime)}`}
              >
                <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                Complete Payment (₹{booking.amount})
              </Link>
            </Button>
          )}

          {booking.canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCancelDialog(true)}
              className="text-xs h-9 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              <XCircle className="h-3.5 w-3.5 mr-1.5" />
              Cancel Booking
            </Button>
          )}

          {!booking.canCancel && (booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs"
              title={booking.cancellationRestrictionReason || 'Cancellation window closed: Must cancel at least 1 hour before scheduled start time.'}
            >
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span>Cancellation Closed (&lt;1h notice)</span>
            </div>
          )}
        </div>
      </div>

      {/* Cancellation Notice Banner (If applicable) */}
      {isCancelled && (
        <div className="p-4 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-sm">
            <XCircle className="h-4 w-4 text-rose-600" />
            <span>Reservation Cancelled</span>
          </div>
          <p className="text-xs text-rose-700 dark:text-rose-300">
            This reservation was marked cancelled on{' '}
            <span className="font-semibold">{booking.formattedUpdatedAt}</span>. The allocated time
            slot was released immediately and returned to public campus availability.
          </p>
          {booking.amount > 0 && booking.payment.status === 'REFUNDED' && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 pt-0.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>100% full refund of ₹{booking.amount} has been initiated to your original payment method.</span>
            </div>
          )}
          {booking.cancellationReason && (
            <p className="text-xs font-medium text-rose-800 dark:text-rose-200 mt-1 italic">
              &ldquo;{booking.cancellationReason}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* Main Two-Column Tracking Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Timeline, Feedback, Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detailed Progress Timeline */}
          <BookingTimeline booking={booking} />

          {/* Feedback & Review Status */}
          <BookingFeedbackCard booking={booking} />

          {/* Additional Notes */}
          {booking.notes && (
            <Card className="border-border/80 shadow-sm">
              <CardHeader className="p-4 pb-2 border-b bg-muted/20">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Reservation Notes & Requirements
                </h3>
              </CardHeader>
              <CardContent className="p-4 text-xs text-foreground leading-relaxed">
                <p className="italic">&ldquo;{booking.notes}&rdquo;</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column (1 col): Key Attributes Sidebar */}
        <div className="space-y-6">
          {/* Schedule & Facility Card */}
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="p-4 pb-2 border-b bg-muted/20">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Schedule & Location
              </h3>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-xs">
              <div className="flex items-start gap-2.5">
                <Calendar className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="text-muted-foreground block font-medium">Scheduled Date</span>
                  <span className="font-bold text-foreground text-sm">
                    {booking.formattedDate}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="text-muted-foreground block font-medium">Time Window</span>
                  <span className="font-bold text-foreground text-sm">
                    {booking.slotTime} ({booking.service.durationMinutes} mins)
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-2 border-t border-border/50">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="text-muted-foreground block font-medium">Campus Location</span>
                  <span className="font-semibold text-foreground">{booking.location}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Provider Desk Card */}
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="p-4 pb-2 border-b bg-muted/20">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                Service Provider
              </h3>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div>
                <span className="text-sm font-bold text-foreground block">
                  {booking.provider.name}
                </span>
                <span className="text-muted-foreground">
                  {booking.service.category?.name || 'Campus Operations Staff'}
                </span>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border/50 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                  <a
                    href={`mailto:${booking.provider.email}`}
                    className="hover:text-primary transition-colors truncate"
                  >
                    {booking.provider.email}
                  </a>
                </div>

                {booking.provider.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{booking.provider.phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment & Amount Summary Card */}
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="p-4 pb-2 border-b bg-muted/20">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-primary" />
                Payment Summary
              </h3>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Fee:</span>
                <span className="text-base font-extrabold text-foreground">
                  {booking.amount === 0 ? 'FREE (Campus Waiver)' : `₹${booking.amount}`}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span>{getPaymentBadge()}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Method:</span>
                <span className="font-semibold text-foreground">
                  {booking.amount === 0 ? 'Campus Grant' : booking.payment.method || 'Razorpay Online'}
                </span>
              </div>

              {booking.payment.transactionId && (
                <div className="pt-2 border-t border-border/50">
                  <span className="text-muted-foreground block text-[11px]">Razorpay Payment ID:</span>
                  <span className="font-mono text-xs text-foreground font-semibold break-all">
                    {booking.payment.transactionId}
                  </span>
                </div>
              )}

              {booking.payment.orderId && (
                <div>
                  <span className="text-muted-foreground block text-[11px]">Razorpay Order ID:</span>
                  <span className="font-mono text-xs text-foreground font-semibold break-all">
                    {booking.payment.orderId}
                  </span>
                </div>
              )}

              {booking.payment.paidAt && (
                <div>
                  <span className="text-muted-foreground block text-[11px]">Authorized On:</span>
                  <span className="text-xs text-foreground font-medium">
                    {booking.payment.formattedPaidAt}
                  </span>
                </div>
              )}

              {booking.canPay && (
                <div className="pt-2">
                  <Button
                    asChild
                    size="sm"
                    className="w-full text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <Link
                      href={`/student/services/${booking.service.id}/review?date=${
                        booking.scheduledAt.split('T')[0]
                      }&slot=${encodeURIComponent(booking.slotTime)}`}
                    >
                      <CreditCard className="h-3.5 w-3.5 mr-1" />
                      Pay ₹{booking.amount} Now
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Service Details Card */}
          <Card className="border-border/80 shadow-sm overflow-hidden">
            {booking.service.imageUrl && (
              <div className="relative h-32 w-full bg-muted">
                <Image
                  src={booking.service.imageUrl}
                  alt={booking.service.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <CardContent className="p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-primary font-semibold uppercase tracking-wider text-[11px]">
                  {booking.service.category?.name}
                </span>
                <Link
                  href={`/student/services/${booking.service.id}`}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  View Catalog
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              <h4 className="font-bold text-sm text-foreground">{booking.service.name}</h4>

              {booking.service.description && (
                <p className="text-muted-foreground line-clamp-3">
                  {booking.service.description}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancellation Dialog */}
      <CancelBookingDialog
        booking={{
          id: booking.id,
          bookingCode: booking.bookingCode,
          status: booking.status,
          tabGroup: 'UPCOMING',
          amount: booking.amount,
          scheduledAt: booking.scheduledAt,
          formattedDate: booking.formattedDate,
          slotTime: booking.slotTime,
          location: booking.location,
          notes: booking.notes,
          createdAt: booking.createdAt,
          formattedCreatedAt: booking.formattedCreatedAt,
          service: booking.service,
          provider: booking.provider,
          payment: booking.payment,
          canCancel: booking.canCancel,
          canPay: booking.canPay,
          cancellationDeadline: booking.cancellationDeadline,
          cancellationRestrictionReason: booking.cancellationRestrictionReason,
          refundEstimate: booking.refundEstimate,
        }}
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onSuccess={() => {
          setShowCancelDialog(false);
          router.refresh();
        }}
      />
    </div>
  );
}
