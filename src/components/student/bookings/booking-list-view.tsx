'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  X,
  Calendar,
  Ticket,
  LayoutGrid,
  Table as TableIcon,
  RefreshCw,
  Compass,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react';
import {
  type StudentBookingItem,
  type StudentBookingsResponse,
} from '@/app/actions/booking-actions';
import { BookingCard } from './booking-card';
import { BookingTable } from './booking-table';
import { BookingPassDialog } from './booking-pass-dialog';
import { CancelBookingDialog } from './cancel-booking-dialog';
import { EmptyState } from '@/components/ui/empty-state';

interface BookingListViewProps {
  initialData: StudentBookingsResponse;
}

export function BookingListView({ initialData }: BookingListViewProps) {
  const router = useRouter();
  const bookings = initialData.bookings;
  const [selectedTab, setSelectedTab] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [paymentFilter, setPaymentFilter] = React.useState<string>('all');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');
  const [sortBy, setSortBy] = React.useState<string>('newest');
  const [viewMode, setViewMode] = React.useState<'table' | 'cards'>('table');

  // Selected booking for dialogs
  const [passBooking, setPassBooking] = React.useState<StudentBookingItem | null>(null);
  const [cancelBooking, setCancelBooking] = React.useState<StudentBookingItem | null>(null);

  // Derive unique categories from student's bookings
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    bookings.forEach((b) => {
      if (b.service.category?.name) set.add(b.service.category.name);
    });
    return Array.from(set);
  }, [bookings]);

  // Tab counts
  const tabCounts = React.useMemo(() => {
    return {
      all: bookings.length,
      upcoming: bookings.filter((b) => b.tabGroup === 'UPCOMING').length,
      active: bookings.filter((b) => b.tabGroup === 'ACTIVE').length,
      completed: bookings.filter((b) => b.tabGroup === 'COMPLETED').length,
      cancelled: bookings.filter((b) => b.tabGroup === 'CANCELLED').length,
    };
  }, [bookings]);

  // Filtered and sorted bookings
  const filteredBookings = React.useMemo(() => {
    return bookings
      .filter((b) => {
        // Tab Group filter
        if (selectedTab !== 'all' && b.tabGroup !== selectedTab.toUpperCase()) {
          return false;
        }

        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchCode = b.bookingCode.toLowerCase().includes(q);
          const matchService = b.service.name.toLowerCase().includes(q);
          const matchProvider = b.provider.name.toLowerCase().includes(q);
          const matchLocation = b.location.toLowerCase().includes(q);
          const matchCategory = b.service.category?.name.toLowerCase().includes(q);
          const matchNotes = b.notes?.toLowerCase().includes(q);

          if (!matchCode && !matchService && !matchProvider && !matchLocation && !matchCategory && !matchNotes) {
            return false;
          }
        }

        // Booking Status filter
        if (statusFilter !== 'all' && b.status !== statusFilter) {
          return false;
        }

        // Payment Status filter
        if (paymentFilter !== 'all' && b.payment.status !== paymentFilter) {
          return false;
        }

        // Category filter
        if (categoryFilter !== 'all' && b.service.category?.name !== categoryFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'upcoming') {
          return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
        }
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === 'amount_desc') {
          return b.amount - a.amount;
        }
        if (sortBy === 'amount_asc') {
          return a.amount - b.amount;
        }
        return 0;
      });
  }, [bookings, selectedTab, searchQuery, statusFilter, paymentFilter, categoryFilter, sortBy]);

  const hasFilterControls =
    searchQuery.trim() !== '' ||
    statusFilter !== 'all' ||
    paymentFilter !== 'all' ||
    categoryFilter !== 'all';

  const hasActiveFilters = hasFilterControls || selectedTab !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setCategoryFilter('all');
    setSelectedTab('all');
  };

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              My Bookings
            </h1>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              {bookings.length} Total
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Track your campus service tokens, schedules, and digital passes in one place.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="text-xs h-9"
            title="Refresh bookings"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
            Refresh
          </Button>

          <Button asChild size="sm" className="text-xs h-9">
            <Link href="/student/services">
              <Compass className="h-3.5 w-3.5 mr-1.5" />
              Book New Service
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setSelectedTab('upcoming')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedTab === 'upcoming'
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-border/70 bg-card hover:bg-muted/30'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Upcoming</span>
            <Calendar className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">{tabCounts.upcoming}</div>
        </button>

        <button
          onClick={() => setSelectedTab('active')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedTab === 'active'
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-border/70 bg-card hover:bg-muted/30'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Active Slots</span>
            <Sparkles className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">{tabCounts.active}</div>
        </button>

        <button
          onClick={() => setSelectedTab('completed')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedTab === 'completed'
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-border/70 bg-card hover:bg-muted/30'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Completed</span>
            <CheckCircle2 className="h-4 w-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">{tabCounts.completed}</div>
        </button>

        <button
          onClick={() => setSelectedTab('cancelled')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedTab === 'cancelled'
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-border/70 bg-card hover:bg-muted/30'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Cancelled</span>
            <XCircle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">{tabCounts.cancelled}</div>
        </button>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid grid-cols-5 h-10 w-full sm:w-auto p-1 bg-muted/60">
          <TabsTrigger value="all" className="text-xs">
            All ({tabCounts.all})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="text-xs">
            Upcoming ({tabCounts.upcoming})
          </TabsTrigger>
          <TabsTrigger value="active" className="text-xs">
            Active ({tabCounts.active})
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs">
            Completed ({tabCounts.completed})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="text-xs">
            Cancelled ({tabCounts.cancelled})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filter and Search Controls Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-card p-3 rounded-xl border border-border/80 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by service, token code, provider, room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8 text-xs h-9 bg-background"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Booking Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-xs w-[130px] bg-background">
              <SelectValue placeholder="Booking Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>

          {/* Payment Status Filter */}
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="h-9 text-xs w-[130px] bg-background">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="SUCCESSFUL">Paid</SelectItem>
              <SelectItem value="FREE_PASS">Free Pass</SelectItem>
              <SelectItem value="PENDING">Unpaid</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="REFUNDED">Refunded</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          {categories.length > 0 && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 text-xs w-[135px] bg-background">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Sort Select */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-9 text-xs w-[140px] bg-background">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest Booked</SelectItem>
              <SelectItem value="upcoming">Scheduled Earliest</SelectItem>
              <SelectItem value="oldest">Oldest Booked</SelectItem>
              <SelectItem value="amount_desc">Price: High to Low</SelectItem>
              <SelectItem value="amount_asc">Price: Low to High</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Switcher (Desktop only) */}
          <div className="hidden md:flex items-center border rounded-lg p-0.5 bg-background">
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 rounded"
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <TableIcon className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 rounded"
              onClick={() => setViewMode('cards')}
              title="Cards View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filter indicator & reset */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between text-xs px-1 text-muted-foreground">
          <span>
            Showing <strong className="text-foreground">{filteredBookings.length}</strong> matching{' '}
            {filteredBookings.length === 1 ? 'reservation' : 'reservations'}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="h-6 text-xs text-primary hover:text-primary/80 px-2"
          >
            Clear all filters
          </Button>
        </div>
      )}

      {/* Bookings Display */}
      {filteredBookings.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title={
            hasFilterControls
              ? 'No matching reservations'
              : selectedTab === 'upcoming'
              ? 'No upcoming reservations'
              : selectedTab === 'active'
              ? 'No active service sessions'
              : selectedTab === 'completed'
              ? 'No completed bookings yet'
              : selectedTab === 'cancelled'
              ? 'No cancelled bookings'
              : 'No bookings found'
          }
          description={
            hasFilterControls
              ? 'No reservations matched your current filter criteria. Try clearing some filters to view your bookings.'
              : selectedTab === 'upcoming'
              ? 'You do not have any upcoming reservations scheduled on campus.'
              : selectedTab === 'active'
              ? 'No active service slots in progress right now.'
              : selectedTab === 'completed'
              ? 'Completed service passes and feedback history will be shown here.'
              : selectedTab === 'cancelled'
              ? 'You do not have any cancelled bookings in your account history.'
              : 'Explore the campus catalog to book laundry, labs, fitness, and equipment.'
          }
          actionLabel={hasFilterControls ? 'Clear Filters' : 'Explore Campus Services'}
          onAction={hasFilterControls ? handleResetFilters : undefined}
          actionHref={!hasFilterControls ? '/student/services' : undefined}
        />
      ) : (
        <>
          {/* Mobile Display: Always clean Cards list */}
          <div className="block md:hidden space-y-3">
            {filteredBookings.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                onViewPass={setPassBooking}
                onCancel={setCancelBooking}
              />
            ))}
          </div>

          {/* Desktop Display: Table or Cards according to viewMode */}
          <div className="hidden md:block">
            {viewMode === 'table' ? (
              <BookingTable
                bookings={filteredBookings}
                onViewPass={setPassBooking}
                onCancel={setCancelBooking}
              />
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBookings.map((b) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    onViewPass={setPassBooking}
                    onCancel={setCancelBooking}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Dialogs */}
      <BookingPassDialog
        booking={passBooking}
        open={Boolean(passBooking)}
        onOpenChange={(open) => !open && setPassBooking(null)}
      />

      <CancelBookingDialog
        booking={cancelBooking}
        open={Boolean(cancelBooking)}
        onOpenChange={(open) => !open && setCancelBooking(null)}
        onSuccess={() => {
          setCancelBooking(null);
          router.refresh();
        }}
      />
    </div>
  );
}
