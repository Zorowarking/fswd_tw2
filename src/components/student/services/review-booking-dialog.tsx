'use client';

import * as React from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Building2,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Lock,
  Sparkles,
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { StudentServiceDetail, ServiceAvailableDate, ServiceTimeSlot } from '@/app/actions/student-service-actions';

interface ReviewBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: StudentServiceDetail;
  selectedDate: ServiceAvailableDate;
  selectedSlot: ServiceTimeSlot;
  notes: string;
  onNotesChange: (notes: string) => void;
  onConfirm: () => Promise<void>;
  isSubmitting: boolean;
}

export function ReviewBookingDialog({
  open,
  onOpenChange,
  service,
  selectedDate,
  selectedSlot,
  notes,
  onNotesChange,
  onConfirm,
  isSubmitting,
}: ReviewBookingDialogProps) {
  const [agreedToTerms, setAgreedToTerms] = React.useState(true);

  const dateObj = new Date(`${selectedDate.dateString}T00:00:00.000Z`);
  const formattedFullDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {/* Step Progress Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            <span className="text-emerald-500 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> 1. Service
            </span>
            <span>•</span>
            <span className="text-emerald-500 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> 2. Date & Time
            </span>
            <span>•</span>
            <span className="text-blue-500 font-bold">3. Review Booking</span>
            <span>•</span>
            <span className="text-muted-foreground/60">4. Confirm</span>
          </div>

          <DialogTitle className="text-xl font-black text-foreground flex items-center justify-between">
            <span>Review Booking Details</span>
            <Badge variant="glow" className="text-xs bg-blue-500/10 text-blue-400">
              Step 3 of 4
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Please review the slot timing, campus facility details, and server-verified pricing before
            confirming your reservation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* 1. Service & Facility Card */}
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Reserved Campus Service
                </span>
                <h4 className="text-base font-black text-foreground">{service.name}</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Category: <strong>{service.categoryName}</strong> • {service.durationMinutes} mins
                  slot duration
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                  Calculated Rate
                </span>
                <p className="text-lg font-black text-foreground font-mono">
                  {service.price === 0 ? <span className="text-emerald-500">Free</span> : `₹${service.price}`}
                </p>
              </div>
            </div>

            {service.location && (
              <div className="flex items-center gap-2 text-muted-foreground text-[11px] pt-1 border-t border-border/50">
                <MapPin className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                <span className="text-foreground font-medium truncate">{service.location}</span>
              </div>
            )}
          </div>

          {/* 2. Schedule & Slot Timing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border/70 bg-card p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5 text-blue-500" />
                Selected Date
              </span>
              <p className="text-sm font-black text-foreground">{formattedFullDate}</p>
              <p className="text-[10px] text-muted-foreground">
                {selectedDate.relativeLabel ? `${selectedDate.relativeLabel} • ` : ''}
                {selectedDate.dayOfWeek}
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-indigo-500" />
                Selected Time Slot
              </span>
              <p className="text-sm font-black font-mono text-foreground">{selectedSlot.timeWindow}</p>
              <p className="text-[10px] text-muted-foreground">
                {selectedSlot.period} window ({service.durationMinutes} minutes)
              </p>
            </div>
          </div>

          {/* 3. Provider & Facility Desk */}
          <div className="rounded-2xl border border-border/70 bg-card p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h5 className="font-bold text-foreground text-xs">{service.providerName}</h5>
                  <Badge variant="glow" className="text-[9px] px-1 py-0 bg-blue-500/10 text-blue-400">
                    Verified Desk
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Authorized campus facility management and work order fulfillment
                </p>
              </div>
            </div>
          </div>

          {/* 4. Notes / Special Requirements */}
          <div className="space-y-1.5">
            <Label htmlFor="review-notes" className="text-xs font-semibold text-foreground">
              Notes / Special Student Requirements (Optional)
            </Label>
            <Textarea
              id="review-notes"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="e.g. Bringing lab equipment, thesis submission, specific court preference..."
              className="text-xs min-h-[60px] resize-none"
            />
          </div>

          {/* 5. Server-Side Price & Billing Verification Notice */}
          <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-blue-950/20 via-card to-indigo-950/20 p-4 space-y-2">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                Server-Verified Payment Summary
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-mono">
                <Lock className="h-3 w-3" />
                Server Calculated
              </span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between text-muted-foreground">
                <span>Standard Facility Charge:</span>
                <span className="font-mono text-foreground">
                  {service.price === 0 ? 'Free' : `₹${service.price}`}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Student Digital Portal Fee:</span>
                <span className="font-mono text-emerald-500">₹0 (Waived)</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Campus Student Subsidy:</span>
                <span className="font-mono text-emerald-500">Applied</span>
              </div>

              <div className="border-t border-border/60 pt-1.5 flex justify-between font-bold text-xs text-foreground">
                <span>Total Amount Payable:</span>
                <span className="text-sm font-black font-mono text-blue-600 dark:text-blue-400">
                  {service.price === 0 ? 'FREE RESERVATION' : `₹${service.price}`}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground pt-1 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-blue-500 shrink-0" />
              <span>Prices are calculated exclusively on server systems. Client parameters are audited.</span>
            </p>
          </div>

          {/* 6. Terms Checkbox */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-border/60 bg-muted/10 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 rounded border-border text-blue-600 focus:ring-blue-500"
            />
            <span className="text-[11px] text-muted-foreground leading-relaxed">
              I agree to report to <strong>{service.location || 'the campus facility desk'}</strong> on time.
              I acknowledge that university regulations require displaying my digital booking pass or student ID.
            </span>
          </label>
        </div>

        <DialogFooter className="flex sm:justify-between gap-2 pt-2 border-t border-border/50">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Modify Date / Slot
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={isSubmitting || !agreedToTerms}
            className="text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                <span>Verifying & Confirming Slot...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                <span>Confirm & Reserve Slot</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
