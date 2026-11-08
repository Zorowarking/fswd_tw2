'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Plus,
  Save,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Loader2,
  Sliders,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  saveWeeklySchedule,
  removeBlockedPeriod,
  type ProviderAvailabilityData,
  type WeeklyDayConfig,
} from '@/app/actions/availability-actions';
import { BlockPeriodDialog } from './block-period-dialog';
import { DayActionDialog } from './day-action-dialog';
import { DayOfWeek } from '@prisma/client';
import { toast } from 'sonner';

interface AvailabilityManagerProps {
  initialData: ProviderAvailabilityData;
}

const DAYS_ORDER: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
};

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

export function AvailabilityManager({ initialData }: AvailabilityManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local state initialized with server data
  const [data, setData] = React.useState<ProviderAvailabilityData>(initialData);
  const [activeTab, setActiveTab] = React.useState<'calendar' | 'weekly' | 'blocked'>('calendar');

  // Month navigation state
  const [currentMonthDate, setCurrentMonthDate] = React.useState<Date>(() => new Date());

  // Weekly schedule draft for editing
  const [scheduleDraft, setScheduleDraft] = React.useState<WeeklyDayConfig[]>(
    initialData.weeklySchedule
  );
  const [isSavingSchedule, setIsSavingSchedule] = React.useState(false);

  // Dialog states
  const [blockDialogOpen, setBlockDialogOpen] = React.useState(false);
  const [blockDialogDate, setBlockDialogDate] = React.useState<string | undefined>(undefined);

  const [dayActionDialogOpen, setDayActionDialogOpen] = React.useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = React.useState<string | null>(null);

  const [deletingPeriodId, setDeletingPeriodId] = React.useState<string | null>(null);

  // Sync state when initialData updates from server without cascading renders
  const [prevInitialData, setPrevInitialData] = React.useState(initialData);
  if (prevInitialData !== initialData) {
    setPrevInitialData(initialData);
    setData(initialData);
    setScheduleDraft(initialData.weeklySchedule);
  }

  const selectedService = data.selectedService;
  const todayStr = new Date().toISOString().split('T')[0];

  // Handle service switch
  const handleSelectService = (serviceId: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('serviceId', serviceId);
    router.push(`/provider/availability?${params.toString()}`);
  };

  // Month navigation helpers
  const handlePrevMonth = () => {
    setCurrentMonthDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  const handleResetToToday = () => {
    setCurrentMonthDate(new Date());
  };

  // Weekly Schedule modification helpers
  const handleToggleDay = (day: DayOfWeek) => {
    setScheduleDraft((prev) =>
      prev.map((d) => (d.dayOfWeek === day ? { ...d, isActive: !d.isActive } : d))
    );
  };

  const handleFieldChange = (
    day: DayOfWeek,
    field: keyof WeeklyDayConfig,
    value: string | number | boolean
  ) => {
    setScheduleDraft((prev) =>
      prev.map((d) => (d.dayOfWeek === day ? { ...d, [field]: value } : d))
    );
  };

  const handleSaveWeeklySchedule = async () => {
    if (!selectedService) return;

    // Validate draft
    for (const d of scheduleDraft) {
      if (d.isActive) {
        if (!d.startTime || !d.endTime) {
          toast.error(`Please provide both start and end time for ${DAY_LABELS[d.dayOfWeek]}.`);
          return;
        }
        if (d.startTime >= d.endTime) {
          toast.error(
            `Start time must be before end time for ${DAY_LABELS[d.dayOfWeek]} (${d.startTime} - ${d.endTime}).`
          );
          return;
        }
        if (d.maxBookingsPerSlot < 1) {
          toast.error(`Capacity for ${DAY_LABELS[d.dayOfWeek]} must be at least 1.`);
          return;
        }
      }
    }

    setIsSavingSchedule(true);
    try {
      const res = await saveWeeklySchedule(selectedService.id, scheduleDraft);
      if (!res.success) {
        toast.error(res.error || 'Failed to save weekly schedule.');
        return;
      }

      toast.success('Weekly operating hours and capacity updated successfully!');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      toast.error(msg);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // Blocked period deletion
  const handleDeletePeriod = async (periodId: string) => {
    setDeletingPeriodId(periodId);
    try {
      const res = await removeBlockedPeriod(periodId);
      if (!res.success) {
        toast.error(res.error || 'Failed to remove restriction.');
        return;
      }
      toast.success('Restriction removed.');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      toast.error(msg);
    } finally {
      setDeletingPeriodId(null);
    }
  };

  // Calendar day click handler
  const handleDayClick = (dateString: string) => {
    setSelectedCalendarDate(dateString);
    setDayActionDialogOpen(true);
  };

  if (!selectedService) {
    return (
      <Card className="border-border/70 p-12 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-lg font-bold text-foreground">No Services Found</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1 mb-6">
          You need to create at least one service before configuring availability and schedules.
        </p>
        <Button onClick={() => router.push('/provider/services/new')} className="bg-blue-600 text-white">
          Create Your First Service
        </Button>
      </Card>
    );
  }

  // Generate Calendar Days for Current Month
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const totalDays = lastDayOfMonth.getDate();

  // Monday = 0, Sunday = 6
  let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startingDayOfWeek === -1) startingDayOfWeek = 6;

  const calendarDays: Array<{
    dateString: string;
    dayNumber: number;
    dayOfWeek: DayOfWeek;
    isCurrentMonth: boolean;
    isPast: boolean;
    isToday: boolean;
  }> = [];

  // Prefix days from previous month
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const prevDate = new Date(year, month - 1, d);
    const dateStr = prevDate.toISOString().split('T')[0];
    const dowIndex = (prevDate.getDay() + 6) % 7;
    calendarDays.push({
      dateString: dateStr,
      dayNumber: d,
      dayOfWeek: DAYS_ORDER[dowIndex],
      isCurrentMonth: false,
      isPast: dateStr < todayStr,
      isToday: dateStr === todayStr,
    });
  }

  // Days of current month
  for (let d = 1; d <= totalDays; d++) {
    const curDate = new Date(Date.UTC(year, month, d));
    const dateStr = curDate.toISOString().split('T')[0];
    const dowIndex = (curDate.getUTCDay() + 6) % 7;
    calendarDays.push({
      dateString: dateStr,
      dayNumber: d,
      dayOfWeek: DAYS_ORDER[dowIndex],
      isCurrentMonth: true,
      isPast: dateStr < todayStr,
      isToday: dateStr === todayStr,
    });
  }

  // Trailing days to fill full grid (multiple of 7)
  const remainingCells = 7 - (calendarDays.length % 7);
  if (remainingCells < 7) {
    for (let d = 1; d <= remainingCells; d++) {
      const nextDate = new Date(Date.UTC(year, month + 1, d));
      const dateStr = nextDate.toISOString().split('T')[0];
      const dowIndex = (nextDate.getUTCDay() + 6) % 7;
      calendarDays.push({
        dateString: dateStr,
        dayNumber: d,
        dayOfWeek: DAYS_ORDER[dowIndex],
        isCurrentMonth: false,
        isPast: dateStr < todayStr,
        isToday: dateStr === todayStr,
      });
    }
  }

  const activeDaysCount = data.weeklySchedule.filter((d) => d.isActive).length;
  const blockedDatesCount = data.blockedPeriods.filter((b) => b.isFullDay).length;
  const partialPeriodsCount = data.blockedPeriods.filter((b) => !b.isFullDay).length;

  return (
    <div className="space-y-6">
      {/* 1. Header & Service Selector Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <span>Service Availability Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Define recurring hours, slot capacity, block dates, and prevent student double booking.
          </p>
        </div>

        {/* Service Switcher & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-card border border-border/80 rounded-2xl px-3 py-1.5 shadow-sm">
            <Building2 className="h-4 w-4 text-blue-500 shrink-0" />
            <select
              value={selectedService.id}
              onChange={(e) => handleSelectService(e.target.value)}
              className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer max-w-[200px] truncate"
            >
              {data.services.map((s) => (
                <option key={s.id} value={s.id} className="bg-popover text-popover-foreground">
                  {s.name} ({s.durationMinutes}m)
                </option>
              ))}
            </select>
          </div>

          <Button
            size="sm"
            onClick={() => {
              setBlockDialogDate(todayStr);
              setBlockDialogOpen(true);
            }}
            className="bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs shadow-md shadow-rose-600/20"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Block Date / Period
          </Button>
        </div>
      </div>

      {/* 2. Top Metric Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3.5 border-border/70 bg-card/70 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Active Days</span>
              <p className="text-base font-black text-foreground">
                {activeDaysCount} of 7 Days Open
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-3.5 border-border/70 bg-card/70 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Slot Length</span>
              <p className="text-base font-black text-foreground">
                {selectedService.durationMinutes} Minutes / Slot
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-3.5 border-border/70 bg-card/70 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Concurrent Capacity</span>
              <p className="text-base font-black text-foreground">
                {selectedService.capacity} Student{selectedService.capacity > 1 ? 's' : ''} / Slot
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-3.5 border-border/70 bg-card/70 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Active Restrictions</span>
              <p className="text-base font-black text-foreground">
                {blockedDatesCount} Closed • {partialPeriodsCount} Partial
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Tabbed Views: Calendar Grid, Weekly Schedule, Blocked Periods */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'calendar' | 'weekly' | 'blocked')}
        className="space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TabsList className="bg-muted/40 p-1 border border-border/60 rounded-xl">
            <TabsTrigger value="calendar" className="text-xs font-semibold gap-1.5 rounded-lg">
              <CalendarIcon className="h-3.5 w-3.5" />
              Calendar View
            </TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs font-semibold gap-1.5 rounded-lg">
              <Sliders className="h-3.5 w-3.5" />
              Weekly Operating Hours & Capacity
            </TabsTrigger>
            <TabsTrigger value="blocked" className="text-xs font-semibold gap-1.5 rounded-lg">
              <ShieldAlert className="h-3.5 w-3.5" />
              Blocked Dates & Maintenance ({data.blockedPeriods.length})
            </TabsTrigger>
          </TabsList>

          {activeTab === 'weekly' && (
            <Button
              size="sm"
              onClick={handleSaveWeeklySchedule}
              disabled={isSavingSchedule}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-md shadow-blue-500/20"
            >
              {isSavingSchedule ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5 mr-1.5" />
              )}
              Save All Operating Hours
            </Button>
          )}
        </div>

        {/* TAB 1: CALENDAR VIEW */}
        <TabsContent value="calendar" className="space-y-4">
          <Card className="border-border/70 bg-card/70 backdrop-blur-sm overflow-hidden">
            {/* Calendar Month Navigation Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-border/60 bg-muted/20">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg border-border/70"
                  onClick={handlePrevMonth}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-base sm:text-lg font-black text-foreground min-w-[160px] text-center sm:text-left">
                  {currentMonthDate.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </h3>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg border-border/70"
                  onClick={handleNextMonth}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground h-8 px-2.5"
                  onClick={handleResetToToday}
                >
                  Today
                </Button>
              </div>

              {/* Legend Strip */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Open</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  <span>Blocked Day</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>Partial Unavailable</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                  <span>Weekly Closed</span>
                </span>
              </div>
            </div>

            {/* Days of Week Row & Calendar Grid Wrapper for Mobile Scroll */}
            <div className="overflow-x-auto">
              <div className="min-w-[580px]">
                <div className="grid grid-cols-7 border-b border-border/60 bg-muted/10 text-center text-xs font-bold text-muted-foreground py-2">
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div>Sat</div>
                  <div>Sun</div>
                </div>

                {/* Calendar Grid Tiles */}
                <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-border/50 bg-background/50">
                  {calendarDays.map((cell) => {
                    const dayConfig = scheduleDraft.find((d) => d.dayOfWeek === cell.dayOfWeek);
                    const isNormallyActive = dayConfig?.isActive ?? false;

                    // Check full-day block
                    const fullDayBlock = data.blockedPeriods.find(
                      (bp) =>
                        bp.isFullDay &&
                        cell.dateString >= bp.startDate &&
                        cell.dateString <= bp.endDate
                    );

                    // Check partial day block
                    const partialBlocks = data.blockedPeriods.filter(
                      (bp) =>
                        !bp.isFullDay &&
                        cell.dateString >= bp.startDate &&
                        cell.dateString <= bp.endDate
                    );

                    const bookingCount = data.bookingsCountByDate[cell.dateString] || 0;

                    return (
                      <div
                        key={cell.dateString}
                        onClick={() => handleDayClick(cell.dateString)}
                        className={`min-h-[105px] sm:min-h-[120px] p-2 flex flex-col justify-between transition-colors cursor-pointer group relative ${
                          !cell.isCurrentMonth
                            ? 'bg-muted/10 opacity-40 hover:opacity-75'
                            : fullDayBlock
                            ? 'bg-rose-500/5 hover:bg-rose-500/10'
                            : isNormallyActive
                            ? 'hover:bg-blue-500/5'
                            : 'bg-muted/20 hover:bg-muted/30'
                        }`}
                      >
                        {/* Top Row: Date Number and Status indicators */}
                        <div className="flex items-start justify-between gap-1">
                          <span
                            className={`inline-flex items-center justify-center text-xs font-black h-6 w-6 rounded-lg ${
                              cell.isToday
                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                                : 'text-foreground'
                            }`}
                          >
                            {cell.dayNumber}
                          </span>

                          {/* Density / Reservation badge */}
                          {bookingCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                              {bookingCount} bkd
                            </span>
                          )}
                        </div>

                        {/* Middle Content: Operating Status / Block Notice */}
                        <div className="space-y-1 my-1">
                          {fullDayBlock ? (
                            <div className="rounded-md bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 truncate">
                              🚫 {fullDayBlock.reason || 'Blocked'}
                            </div>
                          ) : isNormallyActive && dayConfig ? (
                            <>
                              <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 truncate">
                                {dayConfig.startTime}-{dayConfig.endTime}
                              </div>
                              <div className="text-[9px] text-muted-foreground font-mono truncate px-1">
                                Cap: {dayConfig.maxBookingsPerSlot} / slot
                              </div>
                            </>
                          ) : (
                            <div className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground truncate">
                              Closed
                            </div>
                          )}

                          {/* Partial-Day Unavailable Notice */}
                          {partialBlocks.length > 0 && (
                            <div className="rounded-md bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400 truncate">
                              ⏸ {partialBlocks[0].startTime}-{partialBlocks[0].endTime}
                            </div>
                          )}
                        </div>

                        {/* Bottom hover hint */}
                        <div className="text-[9px] text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity">
                          Click to manage
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 2: WEEKLY OPERATING HOURS & CAPACITY */}
        <TabsContent value="weekly" className="space-y-4">
          <Card className="border-border/70 bg-card/70 backdrop-blur-sm p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Recurring Weekly Hours & Concurrency Limits
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Set daily operating time windows, booking slot lengths, and maximum concurrent capacity.
                </p>
              </div>

              <Button
                size="sm"
                onClick={handleSaveWeeklySchedule}
                disabled={isSavingSchedule}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs"
              >
                {isSavingSchedule ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                )}
                Save Changes
              </Button>
            </div>

            <div className="space-y-3">
              {DAYS_ORDER.map((day) => {
                const config = scheduleDraft.find((d) => d.dayOfWeek === day);
                if (!config) return null;

                return (
                  <div
                    key={day}
                    className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${
                      config.isActive
                        ? 'border-border/80 bg-card shadow-sm'
                        : 'border-border/40 bg-muted/20 opacity-60'
                    }`}
                  >
                    {/* Day name & on/off toggle */}
                    <div className="flex items-center gap-3 min-w-[160px]">
                      <button
                        type="button"
                        onClick={() => handleToggleDay(day)}
                        className={`h-6 w-11 rounded-full p-0.5 transition-colors ${
                          config.isActive ? 'bg-emerald-500' : 'bg-muted'
                        }`}
                      >
                        <div
                          className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                            config.isActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <div>
                        <span className="text-sm font-bold text-foreground block">
                          {DAY_LABELS[day]}
                        </span>
                        <span
                          className={`text-[10px] font-semibold uppercase ${
                            config.isActive ? 'text-emerald-500' : 'text-muted-foreground'
                          }`}
                        >
                          {config.isActive ? 'Operating' : 'Closed'}
                        </span>
                      </div>
                    </div>

                    {/* Operational Inputs */}
                    {config.isActive ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 lg:max-w-2xl">
                        {/* Start Time */}
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Start Time</Label>
                          <Input
                            type="time"
                            value={config.startTime}
                            onChange={(e) =>
                              handleFieldChange(day, 'startTime', e.target.value)
                            }
                            className="h-8 text-xs font-mono"
                          />
                        </div>

                        {/* End Time */}
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">End Time</Label>
                          <Input
                            type="time"
                            value={config.endTime}
                            onChange={(e) =>
                              handleFieldChange(day, 'endTime', e.target.value)
                            }
                            className="h-8 text-xs font-mono"
                          />
                        </div>

                        {/* Slot Duration */}
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Duration</Label>
                          <select
                            value={config.slotDuration}
                            onChange={(e) =>
                              handleFieldChange(day, 'slotDuration', Number(e.target.value))
                            }
                            className="w-full h-8 rounded-lg border border-border/80 bg-background px-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {DURATION_OPTIONS.map((dur) => (
                              <option key={dur} value={dur}>
                                {dur} mins
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Capacity Per Slot */}
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Slot Capacity</Label>
                          <Input
                            type="number"
                            min={1}
                            max={500}
                            value={config.maxBookingsPerSlot}
                            onChange={(e) =>
                              handleFieldChange(
                                day,
                                'maxBookingsPerSlot',
                                Math.max(1, Number(e.target.value))
                              )
                            }
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground py-1">
                        Service will not generate booking slots on {DAY_LABELS[day]}s.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        {/* TAB 3: BLOCKED DATES & MAINTENANCE LIST */}
        <TabsContent value="blocked" className="space-y-4">
          <Card className="border-border/70 bg-card/70 backdrop-blur-sm p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Blocked Dates & Maintenance Windows
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Full-day holidays, campus shutdowns, or partial downtime periods.
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  setBlockDialogDate(todayStr);
                  setBlockDialogOpen(true);
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Restriction
              </Button>
            </div>

            {data.blockedPeriods.length > 0 ? (
              <div className="divide-y divide-border/60 rounded-2xl border border-border/70 overflow-hidden">
                {data.blockedPeriods.map((period) => (
                  <div
                    key={period.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-card/40 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                          period.isFullDay
                            ? 'bg-rose-500/10 text-rose-500'
                            : 'bg-amber-500/10 text-amber-500'
                        }`}
                      >
                        {period.isFullDay ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">
                            {period.startDate === period.endDate
                              ? period.startDate
                              : `${period.startDate} to ${period.endDate}`}
                          </span>
                          <Badge
                            variant={period.isFullDay ? 'destructive' : 'outline'}
                            className="text-[10px] py-0"
                          >
                            {period.isFullDay
                              ? 'Full Day Closed'
                              : `${period.startTime} - ${period.endTime}`}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {period.reason || 'General maintenance restriction'}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs text-rose-600 hover:bg-rose-500/10 border-rose-500/30 h-8 self-end sm:self-auto"
                      disabled={deletingPeriodId === period.id}
                      onClick={() => handleDeletePeriod(period.id)}
                    >
                      {deletingPeriodId === period.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 p-8 text-center space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-foreground">No Active Date Restrictions</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Your service is currently operating according to its recurring weekly schedule
                  without any holiday closures or downtime periods.
                </p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Block Period Creation Modal */}
      <BlockPeriodDialog
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
        serviceId={selectedService.id}
        serviceName={selectedService.name}
        defaultDate={blockDialogDate}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* Date Inspection & Quick Management Modal */}
      {selectedCalendarDate && (
        <DayActionDialog
          open={dayActionDialogOpen}
          onOpenChange={setDayActionDialogOpen}
          serviceId={selectedService.id}
          serviceName={selectedService.name}
          dateString={selectedCalendarDate}
          dayConfig={scheduleDraft.find((d) => {
            const dateObj = new Date(`${selectedCalendarDate}T00:00:00.000Z`);
            const dowIndex = (dateObj.getUTCDay() + 6) % 7;
            return d.dayOfWeek === DAYS_ORDER[dowIndex];
          })}
          blockedPeriods={data.blockedPeriods}
          bookingCount={data.bookingsCountByDate[selectedCalendarDate] || 0}
          onOpenAddPeriodModal={(dt) => {
            setBlockDialogDate(dt);
            setBlockDialogOpen(true);
          }}
          onDataChanged={() => {
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
