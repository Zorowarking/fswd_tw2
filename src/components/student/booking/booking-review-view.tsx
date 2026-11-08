'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Building2,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Lock,
  Sparkles,
  User,
  Info,
  CreditCard,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CategoryIcon } from '@/components/categories/category-filter';
import { PaymentGatewayDialog } from './payment-gateway-dialog';
import { BookingConfirmedDialog } from '@/components/student/services/booking-confirmed-dialog';
import type { BookingReviewData, BookingResponseData } from '@/app/actions/booking-actions';

interface BookingReviewViewProps {
  initialReviewData: BookingReviewData;
}

export function BookingReviewView({ initialReviewData }: BookingReviewViewProps) {
  const router = useRouter();
  const [reviewData] = React.useState<BookingReviewData>(initialReviewData);
  const [notes, setNotes] = React.useState(initialReviewData.notes || '');
  const [imageError, setImageError] = React.useState(false);
  const [agreedToPolicies, setAgreedToPolicies] = React.useState(true);

  // Modal states
  const [paymentDialogOpen, setPaymentDialogOpen] = React.useState(false);
  const [confirmedBooking, setConfirmedBooking] = React.useState<BookingResponseData | null>(null);

  const { service, provider, student, schedule, pricing, isAvailable, availabilityWarning } =
    reviewData;

  const handleProceedToPayment = () => {
    if (!isAvailable) return;
    setPaymentDialogOpen(true);
  };

  const handleBookingCompleted = (booking: BookingResponseData) => {
    setConfirmedBooking(booking);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. Header & Step Breadcrumbs */}
      <div className="space-y-3">
        <Link
          href={`/student/services/${service.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Service Details</span>
        </Link>

        {/* Visual Progress Stepper */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <span>Review Booking & Checkout</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Verify your campus reservation timing, facility location, and pricing before initiating payment.
            </p>
          </div>

          {/* Stepper Pills */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="flex items-center gap-1 text-emerald-500">
              <CheckCircle2 className="h-3.5 w-3.5" /> Service
            </span>
            <span className="text-muted-foreground/60">•</span>
            <span className="flex items-center gap-1 text-emerald-500">
              <CheckCircle2 className="h-3.5 w-3.5" /> Slot
            </span>
            <span className="text-muted-foreground/60">•</span>
            <Badge variant="glow" className="text-xs px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border-blue-500/30">
              3. Review
            </Badge>
            <span className="text-muted-foreground/60">•</span>
            <span className="text-muted-foreground">4. Payment</span>
          </div>
        </div>
      </div>

      {/* Availability warning banner if slot is full or blocked */}
      {!isAvailable && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-rose-600 dark:text-rose-400">
              Slot No Longer Available
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {availabilityWarning ||
                'This time slot has reached full student capacity or was recently reserved. Please select another slot.'}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/student/services/${service.id}`)}
              className="h-7 text-xs border-rose-500/30 text-rose-600 mt-2"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Choose Another Date or Slot
            </Button>
          </div>
        </div>
      )}

      {/* 2. Main 2-Column Responsive Checkout Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Booking Items & Verification Specs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Service Information Summary */}
          <Card className="border-border/70 bg-card/70 backdrop-blur-sm overflow-hidden shadow-sm">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  <span>Service Details</span>
                </span>
                <Badge variant="outline" className="text-xs font-normal">
                  {service.categoryName}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Service Thumbnail */}
                <div className="relative h-28 w-full sm:w-36 shrink-0 rounded-2xl overflow-hidden bg-muted border border-border/60">
                  {service.imageUrl && !imageError ? (
                    <Image
                      src={service.imageUrl}
                      alt={service.name}
                      fill
                      unoptimized
                      className="object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-blue-500/10 text-blue-500">
                      <CategoryIcon name={service.categoryIcon} className="h-10 w-10" />
                    </div>
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  <div>
                    <h3 className="text-base font-bold text-foreground">{service.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {service.description || 'Verified campus facility offering.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                    {service.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-purple-500" />
                        <span className="text-foreground font-medium">{service.location}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="h-3.5 w-3.5 text-indigo-500" />
                      <span>{service.durationMinutes} mins slot</span>
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Date, Time Window & Duration Specifications */}
          <Card className="border-border/70 bg-card/70 backdrop-blur-sm shadow-sm">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-indigo-500" />
                <span>Reserved Schedule & Time Slot</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Scheduled Date
                  </span>
                  <p className="text-sm font-black text-foreground">{schedule.formattedDate}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{schedule.dateString}</p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Reserved Time Window
                  </span>
                  <p className="text-sm font-black font-mono text-foreground">{schedule.slotTime}</p>
                  <p className="text-[10px] text-muted-foreground">Standard active slot</p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Session Duration
                  </span>
                  <p className="text-sm font-black text-foreground">
                    {schedule.durationMinutes} Minutes
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Concurrent Cap: {service.capacity}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Provider & Facility Desk */}
          <Card className="border-border/70 bg-card/70 backdrop-blur-sm shadow-sm">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Service Provider Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/20 p-3.5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-foreground">{provider.name}</h4>
                      <Badge variant="glow" className="text-[9px] px-1 py-0 bg-blue-500/10 text-blue-400">
                        Verified
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Authorized campus facility management and work order fulfillment
                    </p>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground sm:text-right">
                  <p>{provider.email}</p>
                  {provider.phone && <p>{provider.phone}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Student Billing Identity */}
          <Card className="border-border/70 bg-card/70 backdrop-blur-sm shadow-sm">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <User className="h-4 w-4 text-purple-500" />
                <span>Student Billing Identity</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-border/60 bg-muted/10 p-3 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    Student Name
                  </span>
                  <p className="font-bold text-foreground">{student.name}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/10 p-3 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    University Email
                  </span>
                  <p className="font-bold font-mono text-foreground">{student.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 5: Notes & Campus Instructions */}
          <Card className="border-border/70 bg-card/70 backdrop-blur-sm shadow-sm">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-500" />
                <span>Special Instructions / Requirements (Optional)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-2 space-y-3">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Bringing lab hardware, academic supervisor letter, specific court preference..."
                className="text-xs min-h-[70px] resize-none"
              />

              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-border/60 bg-muted/10 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={agreedToPolicies}
                  onChange={(e) => setAgreedToPolicies(e.target.checked)}
                  className="mt-0.5 rounded border-border text-blue-600 focus:ring-blue-500"
                />
                <span className="text-[11px] text-muted-foreground leading-relaxed">
                  I agree to report at <strong>{service.location || 'the campus facility desk'}</strong> on time.
                  Cancellations or modifications must be made before slot commencement.
                </span>
              </label>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col): Sticky Order Summary & "Proceed to Payment" */}
        <div className="space-y-6">
          <div className="sticky top-20 space-y-4">
            <Card className="border-border/80 bg-card/90 backdrop-blur-md shadow-xl overflow-hidden">
              {/* Header Strip */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wide uppercase text-blue-100 flex items-center gap-1.5">
                    <Receipt className="h-3.5 w-3.5" />
                    Payment Summary
                  </span>
                  <Badge className="bg-white/20 text-white border-none text-[10px]">
                    Server Verified
                  </Badge>
                </div>
                <p className="text-[11px] text-blue-100/90 mt-1">
                  Itemized billing & campus student subsidization
                </p>
              </div>

              <CardContent className="p-5 space-y-4">
                {/* Price Breakdown Line Items */}
                <div className="space-y-2.5 text-xs">
                  {/* Base Rate */}
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Service Base Price</span>
                    <span className="font-mono font-semibold text-foreground">
                      {pricing.isFree ? 'Free' : `₹${pricing.basePrice.toFixed(2)}`}
                    </span>
                  </div>

                  {/* Taxes & Fees */}
                  <div className="flex justify-between items-center text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span>{pricing.taxLabel}</span>
                    </div>
                    <span className="font-mono">
                      {pricing.isFree ? '₹0.00' : `₹${pricing.taxesAndFees.toFixed(2)}`}
                    </span>
                  </div>

                  {/* Platform / Convenience Fee */}
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Campus Digital Gateway Fee</span>
                    <span className="font-mono text-emerald-500 font-semibold">Waived (₹0)</span>
                  </div>

                  {/* Campus Student Subsidy (if paid or free) */}
                  {!pricing.isFree && pricing.taxesAndFees > 0 && (
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>University Tax Relief / Subsidy</span>
                      <span className="font-mono text-emerald-500 font-semibold">
                        -₹{pricing.taxesAndFees.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {pricing.isFree && (
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>University Student Subsidy</span>
                      <span className="font-mono text-emerald-500 font-semibold">100% Grant</span>
                    </div>
                  )}

                  <div className="border-t border-border/80 pt-3 flex justify-between items-baseline font-bold">
                    <div>
                      <span className="text-sm text-foreground block">Final Amount</span>
                      <span className="text-[10px] text-muted-foreground font-normal">
                        Inclusive of all campus fees
                      </span>
                    </div>
                    <span className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
                      {pricing.isFree ? 'FREE PASS' : `₹${pricing.finalAmount.toFixed(2)}`}
                    </span>
                  </div>
                </div>

                {/* Primary CTA: "Proceed to Payment" */}
                <div className="pt-2 space-y-2">
                  <Button
                    type="button"
                    size="lg"
                    onClick={handleProceedToPayment}
                    disabled={!isAvailable || !agreedToPolicies}
                    className="w-full text-xs font-bold gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 h-12"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Proceed to Payment</span>
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>

                  <p className="text-[11px] text-center text-muted-foreground">
                    Do not create a confirmed booking yet — booking will be issued after payment
                    verification.
                  </p>
                </div>

                {/* Trust & Security Guarantees */}
                <div className="border-t border-border/60 pt-3 space-y-2 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>256-bit SSL secured campus checkout</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span>Instant digital token issued upon payment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    <span>Guaranteed slot reservation at authorized desk</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Back to Edit */}
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/student/services/${service.id}`)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Change Date or Slot
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Gateway Modal (Invoked on "Proceed to Payment") */}
      <PaymentGatewayDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        reviewData={reviewData}
        notes={notes}
        onSuccess={handleBookingCompleted}
      />

      {/* Booking Confirmed Digital Token Slip (Post-Payment) */}
      <BookingConfirmedDialog
        open={!!confirmedBooking}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmedBooking(null);
            router.push('/student/bookings');
          }
        }}
        booking={confirmedBooking}
        onBookAnother={() => router.push('/student/services')}
      />
    </div>
  );
}
