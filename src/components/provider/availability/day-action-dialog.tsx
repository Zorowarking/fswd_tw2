'use client';

import * as React from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Users,
  Trash2,
  Plus,
  Loader2,
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
import {
  quickToggleDateBlocked,
  removeBlockedPeriod,
  type BlockedPeriodItem,
  type WeeklyDayConfig,
} from '@/app/actions/availability-actions';
import { toast } from 'sonner';

interface DayActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceId: string;
  serviceName: string;
  dateString: string; // YYYY-MM-DD
  dayConfig?: WeeklyDayConfig;
  blockedPeriods: BlockedPeriodItem[];
  bookingCount: number;
  onOpenAddPeriodModal: (dateString: string) => void;
  onDataChanged: () => void;
}

export function DayActionDialog({
  open,
  onOpenChange,
  serviceId,
  serviceName,
  dateString,
  dayConfig,
  blockedPeriods,
  bookingCount,
  onOpenAddPeriodModal,
  onDataChanged,
}: DayActionDialogProps) {
  const [isTogglingBlock, setIsTogglingBlock] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  if (!dateString) return null;

  const dateObj = new Date(`${dateString}T00:00:00.000Z`);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Check if date is full-day blocked
  const fullDayBlock = blockedPeriods.find(
    (bp) => bp.isFullDay && dateString >= bp.startDate && dateString <= bp.endDate
  );

  // Partial day periods that apply to this date
  const partialBlocks = blockedPeriods.filter(
    (bp) => !bp.isFullDay && dateString >= bp.startDate && dateString <= bp.endDate
  );

  const isNormallyActive = dayConfig ? dayConfig.isActive : true;

  const handleQuickToggleBlock = async () => {
    setIsTogglingBlock(true);
    try {
      const res = await quickToggleDateBlocked(
        serviceId,
        dateString,
        'Blocked by provider schedule action'
      );
      if (!res.success) {
        toast.error(res.error || 'Failed to update date restriction.');
        return;
      }

      toast.success(
        res.data?.isBlocked ? `Date ${dateString} is now blocked.` : `Date ${dateString} unblocked.`
      );
      onDataChanged();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      toast.error(msg);
    } finally {
      setIsTogglingBlock(false);
    }
  };

  const handleRemovePeriod = async (periodId: string) => {
    setDeletingId(periodId);
    try {
      const res = await removeBlockedPeriod(periodId);
      if (!res.success) {
        toast.error(res.error || 'Failed to delete period.');
        return;
      }
      toast.success('Restriction removed.');
      onDataChanged();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-blue-500 font-semibold text-xs tracking-wider uppercase">
            <CalendarIcon className="h-4 w-4" />
            <span>Date Schedule Management</span>
          </div>
          <DialogTitle className="text-xl font-bold">{formattedDate}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Operating schedule, booked slots, and restrictions for {serviceName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Status strip */}
          <div className="flex items-center justify-between p-3 rounded-2xl border border-border/70 bg-muted/20">
            <div className="flex items-center gap-2.5">
              {fullDayBlock ? (
                <div className="h-8 w-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <ShieldAlert className="h-4 w-4" />
                </div>
              ) : isNormallyActive ? (
                <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              ) : (
                <div className="h-8 w-8 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
              )}

              <div>
                <p className="text-xs font-bold text-foreground">
                  {fullDayBlock
                    ? 'Full Day Blocked'
                    : isNormallyActive
                    ? 'Open for Bookings'
                    : 'Scheduled Weekly Closure'}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {dayConfig && isNormallyActive
                    ? `Hours: ${dayConfig.startTime} - ${dayConfig.endTime} (${dayConfig.slotDuration}m slots)`
                    : 'Standard operating hours closed'}
                </p>
              </div>
            </div>

            <Badge
              variant={fullDayBlock ? 'destructive' : isNormallyActive ? 'glow' : 'outline'}
              className="text-[10px]"
            >
              {fullDayBlock ? 'Closed' : isNormallyActive ? 'Active' : 'Off'}
            </Badge>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl border border-border/70 bg-card">
              <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3 text-blue-500" />
                Capacity / Slot
              </span>
              <p className="text-base font-black text-foreground mt-0.5">
                {dayConfig?.maxBookingsPerSlot || 1} student{dayConfig?.maxBookingsPerSlot === 1 ? '' : 's'}
              </p>
            </div>

            <div className="p-3 rounded-xl border border-border/70 bg-card">
              <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3 text-indigo-500" />
                Confirmed Bookings
              </span>
              <p className="text-base font-black text-foreground mt-0.5">
                {bookingCount} reservation{bookingCount === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          {/* Active Restrictions on this Date */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Active Date Restrictions</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] text-blue-500 hover:text-blue-600 px-2"
                onClick={() => {
                  onOpenChange(false);
                  onOpenAddPeriodModal(dateString);
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Window
              </Button>
            </div>

            {fullDayBlock && (
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/5">
                <div className="text-xs">
                  <p className="font-bold text-rose-600 dark:text-rose-400">Entire Day Blocked</p>
                  <p className="text-[10px] text-muted-foreground">
                    Reason: {fullDayBlock.reason || 'None specified'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs border-rose-500/30 text-rose-600 hover:bg-rose-500/10"
                  disabled={deletingId === fullDayBlock.id}
                  onClick={() => handleRemovePeriod(fullDayBlock.id)}
                >
                  {deletingId === fullDayBlock.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    'Unblock'
                  )}
                </Button>
              </div>
            )}

            {partialBlocks.map((pb) => (
              <div
                key={pb.id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5"
              >
                <div className="text-xs">
                  <p className="font-bold text-amber-600 dark:text-amber-400">
                    {pb.startTime} - {pb.endTime}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Reason: {pb.reason || 'Maintenance window'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600"
                  disabled={deletingId === pb.id}
                  onClick={() => handleRemovePeriod(pb.id)}
                >
                  {deletingId === pb.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            ))}

            {!fullDayBlock && partialBlocks.length === 0 && (
              <div className="rounded-xl border border-dashed border-border/70 p-3 text-center text-xs text-muted-foreground">
                No active blocks or maintenance windows for this date.
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/50">
          <Button
            type="button"
            variant={fullDayBlock ? 'default' : 'destructive'}
            size="sm"
            disabled={isTogglingBlock}
            onClick={handleQuickToggleBlock}
            className="w-full sm:w-auto"
          >
            {isTogglingBlock && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            {fullDayBlock ? 'Unblock Date' : 'Block Entire Day'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

