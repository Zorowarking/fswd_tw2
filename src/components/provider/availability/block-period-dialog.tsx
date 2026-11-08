'use client';

import * as React from 'react';
import { Calendar as CalendarIcon, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addBlockedPeriod, type BlockedPeriodItem } from '@/app/actions/availability-actions';
import { toast } from 'sonner';

interface BlockPeriodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceId: string;
  serviceName: string;
  defaultDate?: string; // YYYY-MM-DD
  onSuccess?: (newPeriod: BlockedPeriodItem) => void;
}

export function BlockPeriodDialog({
  open,
  onOpenChange,
  serviceId,
  serviceName,
  defaultDate,
  onSuccess,
}: BlockPeriodDialogProps) {
  const today = new Date().toISOString().split('T')[0];

  const [startDate, setStartDate] = React.useState(defaultDate || today);
  const [endDate, setEndDate] = React.useState(defaultDate || today);
  const [isFullDay, setIsFullDay] = React.useState(true);
  const [startTime, setStartTime] = React.useState('13:00');
  const [endTime, setEndTime] = React.useState('15:00');
  const [reason, setReason] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Synchronize when defaultDate changes without cascading render effects
  const [prevDefaultDate, setPrevDefaultDate] = React.useState(defaultDate);
  if (prevDefaultDate !== defaultDate) {
    setPrevDefaultDate(defaultDate);
    if (defaultDate) {
      setStartDate(defaultDate);
      setEndDate(defaultDate);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      toast.error('Please specify both start and end dates.');
      return;
    }

    if (startDate > endDate) {
      toast.error('Start date cannot be after end date.');
      return;
    }

    if (!isFullDay) {
      if (!startTime || !endTime) {
        toast.error('Please specify both start and end times for partial-day unavailability.');
        return;
      }
      if (startTime >= endTime) {
        toast.error('Start time must be before end time.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const res = await addBlockedPeriod(serviceId, {
        startDate,
        endDate,
        isFullDay,
        startTime: isFullDay ? undefined : startTime,
        endTime: isFullDay ? undefined : endTime,
        reason: reason.trim() || undefined,
      });

      if (!res.success || !res.data) {
        toast.error(res.error || 'Failed to create blocked period.');
        setIsSubmitting(false);
        return;
      }

      toast.success(
        isFullDay
          ? `Date ${startDate === endDate ? startDate : `${startDate} to ${endDate}`} successfully blocked.`
          : `Unavailable window (${startTime} - ${endTime}) added.`
      );

      setReason('');
      onOpenChange(false);
      onSuccess?.(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-500 font-semibold text-xs tracking-wider uppercase">
            <AlertTriangle className="h-4 w-4" />
            <span>Availability Restriction</span>
          </div>
          <DialogTitle className="text-xl font-bold">
            Block Date or Unavailable Period
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure full-day closures or maintenance downtime for{' '}
            <strong className="text-foreground">{serviceName}</strong>. Students will not be able
            to book slots in this window.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Period Type Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Restriction Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsFullDay(true)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                  isFullDay
                    ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold ring-1 ring-rose-500/30'
                    : 'border-border/70 bg-card hover:bg-muted/40 text-muted-foreground'
                }`}
              >
                <CalendarIcon className="h-4 w-4 mb-1" />
                <span>Full Day Block</span>
                <span className="text-[10px] opacity-75 font-normal">Closed all day</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFullDay(false)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                  !isFullDay
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold ring-1 ring-amber-500/30'
                    : 'border-border/70 bg-card hover:bg-muted/40 text-muted-foreground'
                }`}
              >
                <Clock className="h-4 w-4 mb-1" />
                <span>Unavailable Window</span>
                <span className="text-[10px] opacity-75 font-normal">Specific hours</span>
              </button>
            </div>
          </div>

          {/* Date Range Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start-date" className="text-xs font-medium">
                Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                min={today}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) {
                    setEndDate(e.target.value);
                  }
                }}
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="end-date" className="text-xs font-medium">
                End Date
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                min={startDate || today}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="text-xs"
              />
            </div>
          </div>

          {/* Partial-Day Time Window */}
          {!isFullDay && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5">
              <div className="space-y-1.5">
                <Label htmlFor="start-time" className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  From Time
                </Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="end-time" className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  To Time
                </Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>
            </div>
          )}

          {/* Reason Input */}
          <div className="space-y-1.5">
            <Label htmlFor="block-reason" className="text-xs font-medium">
              Reason / Public Notice (Optional)
            </Label>
            <Input
              id="block-reason"
              placeholder="e.g. Scheduled Maintenance, Campus Convocation, Deep Cleaning"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              This reason will be logged on your schedule and informs operations desks.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              {isFullDay ? 'Confirm Date Block' : 'Apply Unavailable Hours'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
