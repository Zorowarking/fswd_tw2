'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type {
  StudentServiceDetail,
  ServiceAvailableDate,
  ServiceTimeSlot,
} from '@/app/actions/student-service-actions';
import { toast } from 'sonner';

interface StudentBookingWidgetProps {
  service: StudentServiceDetail;
}

export function StudentBookingWidget({ service }: StudentBookingWidgetProps) {
  const router = useRouter();

  // Available dates
  const availableDates = service.availableDates.filter((d) => d.isAvailable);

  const [selectedDate, setSelectedDate] = React.useState<ServiceAvailableDate | null>(
    availableDates[0] || null
  );

  const [selectedSlot, setSelectedSlot] = React.useState<ServiceTimeSlot | null>(
    availableDates[0]?.slots[0] || null
  );

  const [notes, setNotes] = React.useState('');
  const [isNavigating, setIsNavigating] = React.useState(false);

  // When selected date changes, select first slot of that date
  const handleSelectDate = (date: ServiceAvailableDate) => {
    setSelectedDate(date);
    setSelectedSlot(date.slots[0] || null);
  };

  // Open review page before payment
  const handleProceedToReview = () => {
    if (!selectedDate || !selectedSlot) {
      toast.error('Please select an available date and time slot first.');
      return;
    }

    setIsNavigating(true);
    const params = new URLSearchParams();
    params.set('date', selectedDate.dateString);
    params.set('slot', selectedSlot.timeWindow);
    if (notes.trim()) {
      params.set('notes', notes.trim());
    }

    router.push(`/student/services/${service.id}/review?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Main Interactive Booking Card */}
      <Card className="overflow-hidden border-border/80 bg-card/80 backdrop-blur-md shadow-xl shadow-blue-500/5">
        {/* Banner with verified server pricing */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide uppercase text-blue-100 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Instant Reservation
            </span>
            <Badge className="bg-white/20 hover:bg-white/30 text-white border-none text-[11px]">
              {service.capacity} Capacity / Slot
            </Badge>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            {service.price === 0 ? (
              <span className="text-2xl sm:text-3xl font-black">Free Pass</span>
            ) : (
              <>
                <span className="text-2xl sm:text-3xl font-black">₹{service.price}</span>
                <span className="text-xs text-blue-100">/ {service.durationMinutes} mins slot</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-blue-100/90 mt-1">
            Zero hidden charges • Server-verified pricing • Instant campus token
          </p>
        </div>

        <CardContent className="p-5 space-y-5">
          {/* Flow Stepper Indicator */}
          <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground border-b border-border/60 pb-3">
            <span className="text-blue-500 font-bold">1. Select Date</span>
            <span>→</span>
            <span className={selectedDate ? 'text-blue-500 font-bold' : ''}>2. Select Time</span>
            <span>→</span>
            <span>3. Review</span>
            <span>→</span>
            <span>4. Confirm</span>
          </div>

          {/* 1. Date Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5 text-blue-500" />
                Select Available Date
              </Label>
              <span className="text-[10px] text-muted-foreground font-mono">
                {availableDates.length} upcoming days
              </span>
            </div>

            {availableDates.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableDates.map((date) => {
                  const isSelected = selectedDate?.dateString === date.dateString;
                  return (
                    <button
                      key={date.dateString}
                      type="button"
                      onClick={() => handleSelectDate(date)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600/10 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/30 font-bold shadow-sm'
                          : 'border-border/70 bg-card hover:bg-muted/40 text-foreground'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                        {date.relativeLabel || date.dayOfWeek.slice(0, 3)}
                      </span>
                      <span className="text-xs font-black mt-0.5">
                        {date.displayDate.split(', ')[1]}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 p-4 text-center text-xs text-amber-700 dark:text-amber-400">
                <AlertCircle className="h-4 w-4 mx-auto mb-1 text-amber-500" />
                <p className="font-semibold">No dates currently available</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  All upcoming slots are fully booked or temporarily restricted by the provider.
                </p>
              </div>
            )}
          </div>

          {/* 2. Time Slot Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-indigo-500" />
                Select Time Window ({service.durationMinutes} mins)
              </Label>
              {selectedDate && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  {selectedDate.slots.length} slots open
                </span>
              )}
            </div>

            {selectedDate && selectedDate.slots.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                {selectedDate.slots.map((slot) => {
                  const isSelected = selectedSlot?.id === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`flex items-center justify-between px-2.5 py-2 rounded-xl border text-left transition-all text-xs font-mono ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white font-bold shadow-sm'
                          : 'border-border/70 bg-card hover:bg-muted/50 text-foreground'
                      }`}
                    >
                      <span className="truncate">{slot.timeWindow}</span>
                      <span
                        className={`text-[9px] uppercase px-1 rounded ${
                          isSelected ? 'bg-white/20 text-white' : 'text-muted-foreground'
                        }`}
                      >
                        {slot.period[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
                No slots open on this date.
              </div>
            )}
          </div>

          {/* 3. Special Instructions / Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-semibold text-foreground">
              Notes or Special Requirements (Optional)
            </Label>
            <Input
              id="notes"
              placeholder="e.g. Bringing student project hardware, thesis submission"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* 4. Pricing Summary */}
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1.5 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Slot Duration</span>
              <span className="font-mono text-foreground">{service.durationMinutes} minutes</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Estimated Rate</span>
              <span>{service.price === 0 ? 'Free' : `₹${service.price}`}</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-[11px]">
              <span>Campus Student Subsidy</span>
              <span className="text-emerald-500 font-semibold">Applied (100%)</span>
            </div>
            <div className="border-t border-border/60 pt-1.5 flex justify-between font-bold text-foreground">
              <span>Total Payable</span>
              <span className="text-sm font-mono text-blue-600 dark:text-blue-400">
                {service.price === 0 ? 'FREE' : `₹${service.price}`}
              </span>
            </div>
          </div>

          {/* 5. Review Booking CTA */}
          <Button
            type="button"
            size="lg"
            variant="default"
            onClick={handleProceedToReview}
            isLoading={isNavigating}
            disabled={isNavigating || !selectedDate || !selectedSlot}
            className="w-full text-xs font-bold gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 h-11"
          >
            {!isNavigating && <FileCheck2 className="h-4 w-4" />}
            <span>{isNavigating ? 'Preparing Booking Checkout...' : 'Review Booking Details'}</span>
            <span className="opacity-80">•</span>
            <span>{service.price === 0 ? 'Free' : `₹${service.price}`}</span>
            {!isNavigating && <ArrowRight className="h-4 w-4 ml-1" />}
          </Button>

          {/* Student Assurance */}
          <div className="flex items-center gap-2 justify-center text-[11px] text-muted-foreground pt-1">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span>Authenticated student guarantee • Server-verified pricing</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
