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
  Ticket,
  LayoutGrid,
  Table as TableIcon,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Sparkles,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import {
  type ProviderBookingItem,
  type ProviderBookingsSummary,
} from '@/app/actions/provider-booking-actions';
import { ProviderBookingCard } from './provider-booking-card';
import { ProviderBookingTable } from './provider-booking-table';
import { RejectBookingDialog } from './reject-booking-dialog';
import { EmptyState } from '@/components/ui/empty-state';

interface ProviderBookingListViewProps {
  initialData: ProviderBookingsSummary;
}

export function ProviderBookingListView({ initialData }: ProviderBookingListViewProps) {
  const router = useRouter();
  const bookings = initialData.bookings;
  const metrics = initialData.metrics;
  const services = initialData.services;

  const [selectedTab, setSelectedTab] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [serviceFilter, setServiceFilter] = React.useState<string>('all');
  const [paymentFilter, setPaymentFilter] = React.useState<string>('all');
  const [sortBy, setSortBy] = React.useState<string>('scheduled');
  const [viewMode, setViewMode] = React.useState<'table' | 'cards'>('table');

  // Selected booking for reject modal
  const [rejectBooking, setRejectBooking] = React.useState<ProviderBookingItem | null>(null);

  // Tab counts
  const tabCounts = React.useMemo(() => {
    return {
      all: bookings.length,
      pending: bookings.filter((b) => b.status === 'PENDING').length,
      confirmed: bookings.filter((b) => b.status === 'CONFIRMED').length,
      inProgress: bookings.filter((b) => b.status === 'IN_PROGRESS').length,
      completed: bookings.filter((b) => b.status === 'COMPLETED').length,
      cancelled: bookings.filter((b) => b.status === 'CANCELLED' || b.status === 'REJECTED').length,
    };
  }, [bookings]);

  // Filtered and sorted bookings
  const filteredBookings = React.useMemo(() => {
    return bookings
      .filter((b) => {
        // Tab filter
        if (selectedTab === 'pending' && b.status !== 'PENDING') return false;
        if (selectedTab === 'confirmed' && b.status !== 'CONFIRMED') return false;
        if (selectedTab === 'inProgress' && b.status !== 'IN_PROGRESS') return false;
        if (selectedTab === 'completed' && b.status !== 'COMPLETED') return false;
        if (selectedTab === 'cancelled' && b.status !== 'CANCELLED' && b.status !== 'REJECTED') {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchStudent = b.student.name.toLowerCase().includes(q);
          const matchEmail = b.student.email.toLowerCase().includes(q);
          const matchCode = b.bookingCode.toLowerCase().includes(q);
          const matchService = b.service.name.toLowerCase().includes(q);
          const matchNotes = b.notes?.toLowerCase().includes(q);

          if (!matchStudent && !matchEmail && !matchCode && !matchService && !matchNotes) {
            return false;
          }
        }

        // Service filter
        if (serviceFilter !== 'all' && b.service.id !== serviceFilter) {
          return false;
        }

        // Payment filter
        if (paymentFilter !== 'all' && b.payment.status !== paymentFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'scheduled') {
          return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
        }
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'amount_desc') {
          return b.amount - a.amount;
        }
        if (sortBy === 'amount_asc') {
          return a.amount - b.amount;
        }
        return 0;
      });
  }, [bookings, selectedTab, searchQuery, serviceFilter, paymentFilter, sortBy]);

  const hasFilterControls =
    searchQuery.trim() !== '' || serviceFilter !== 'all' || paymentFilter !== 'all';
  const hasActiveFilters = hasFilterControls || selectedTab !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setServiceFilter('all');
    setPaymentFilter('all');
    setSelectedTab('all');
  };

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Provider Booking Management
            </h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
              {metrics.total} Requests
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage incoming reservation queues, accept or decline requests, and track service fulfillment.
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
            <Link href="/provider/services">
              View My Services
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Pending Card (Urgent Action Highlight) */}
        <button
          onClick={() => setSelectedTab('pending')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedTab === 'pending'
              ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm'
              : metrics.pending > 0
              ? 'border-amber-300 bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-50/50'
              : 'border-border/70 bg-card hover:bg-muted/30'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span>Pending Action</span>
            <AlertCircle className={`h-4 w-4 ${metrics.pending > 0 ? 'text-amber-600 animate-pulse' : 'text-muted-foreground'}`} />
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">{metrics.pending}</div>
        </button>

        {/* Confirmed */}
        <button
          onClick={() => setSelectedTab('confirmed')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedTab === 'confirmed'
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-border/70 bg-card hover:bg-muted/30'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Confirmed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">{metrics.confirmed}</div>
        </button>

        {/* In Progress */}
        <button
          onClick={() => setSelectedTab('inProgress')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedTab === 'inProgress'
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-border/70 bg-card hover:bg-muted/30'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>In Progress</span>
            <Sparkles className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">{metrics.inProgress}</div>
        </button>

        {/* Completed */}
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
          <div className="text-2xl font-bold text-foreground mt-1">{metrics.completed}</div>
        </button>

        {/* Cancelled/Rejected */}
        <button
          onClick={() => setSelectedTab('cancelled')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedTab === 'cancelled'
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-border/70 bg-card hover:bg-muted/30'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Declined</span>
            <XCircle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">{metrics.cancelled}</div>
        </button>

        {/* Total Revenue */}
        <div className="p-3.5 rounded-xl border border-border/70 bg-card">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Verified Revenue</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-foreground mt-1 truncate">₹{metrics.revenue}</div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid grid-cols-6 h-10 w-full sm:w-auto p-1 bg-muted/60">
          <TabsTrigger value="all" className="text-xs">
            All ({tabCounts.all})
          </TabsTrigger>
          <TabsTrigger value="pending" className="text-xs">
            Pending ({tabCounts.pending})
          </TabsTrigger>
          <TabsTrigger value="confirmed" className="text-xs">
            Confirmed ({tabCounts.confirmed})
          </TabsTrigger>
          <TabsTrigger value="inProgress" className="text-xs">
            Active ({tabCounts.inProgress})
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs">
            Completed ({tabCounts.completed})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="text-xs">
            Declined ({tabCounts.cancelled})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-card p-3 rounded-xl border border-border/80 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by student, email, token, service..."
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

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Service Filter */}
          {services.length > 0 && (
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="h-9 text-xs w-[140px] bg-background">
                <SelectValue placeholder="My Services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Payment Filter */}
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

          {/* Sort Select */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-9 text-xs w-[145px] bg-background">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Scheduled (Soonest)</SelectItem>
              <SelectItem value="newest">Requested (Newest)</SelectItem>
              <SelectItem value="amount_desc">Price: High to Low</SelectItem>
              <SelectItem value="amount_asc">Price: Low to High</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Switcher (Desktop) */}
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

      {/* Active filters strip */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between text-xs px-1 text-muted-foreground">
          <span>
            Showing <strong className="text-foreground">{filteredBookings.length}</strong> matching{' '}
            {filteredBookings.length === 1 ? 'request' : 'requests'}
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
              ? 'No matching booking requests'
              : selectedTab === 'pending'
              ? 'No pending booking requests'
              : selectedTab === 'inProgress'
              ? 'No active service sessions'
              : services.length === 0
              ? 'No services created yet'
              : 'No reservations in this section'
          }
          description={
            hasFilterControls
              ? 'No student bookings match your active search or filter selection. Try clearing filters.'
              : selectedTab === 'pending'
              ? 'All booking request queues are currently clear and up to date.'
              : selectedTab === 'inProgress'
              ? 'No services are actively marked in progress right now.'
              : services.length === 0
              ? 'Create your first campus service to start receiving student bookings.'
              : 'New student reservation requests will appear here in real time.'
          }
          actionLabel={
            hasFilterControls
              ? 'Reset Filters'
              : services.length === 0
              ? 'Create First Service'
              : undefined
          }
          onAction={hasFilterControls ? handleResetFilters : undefined}
          actionHref={!hasFilterControls && services.length === 0 ? '/provider/services/new' : undefined}
        />
      ) : (
        <>
          {/* Mobile Display: Cards */}
          <div className="block md:hidden space-y-3">
            {filteredBookings.map((b) => (
              <ProviderBookingCard
                key={b.id}
                booking={b}
                onReject={setRejectBooking}
                onSuccess={handleRefresh}
              />
            ))}
          </div>

          {/* Desktop Display: Table or Cards */}
          <div className="hidden md:block">
            {viewMode === 'table' ? (
              <ProviderBookingTable
                bookings={filteredBookings}
                onReject={setRejectBooking}
                onSuccess={handleRefresh}
              />
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBookings.map((b) => (
                  <ProviderBookingCard
                    key={b.id}
                    booking={b}
                    onReject={setRejectBooking}
                    onSuccess={handleRefresh}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Reject Modal */}
      <RejectBookingDialog
        booking={rejectBooking}
        open={Boolean(rejectBooking)}
        onOpenChange={(open) => !open && setRejectBooking(null)}
        onSuccess={() => {
          setRejectBooking(null);
          handleRefresh();
        }}
      />
    </div>
  );
}
