'use client';

import * as React from 'react';
import {
  CalendarDays,
  Search,
  ShieldCheck,
  Building2,
  GraduationCap,
  Eye,
  CheckCircle2,
  Clock,
  Inbox,
  Star,
  MapPin,
  AlertCircle,
  Loader2,
  DollarSign,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import { EmptyState, TableEmptyState } from '@/components/ui/empty-state';
import {
  getAdminBookingsData,
  getAdminBookingDetails,
  adminUpdateBookingStatusAction,
  type AdminBookingsData,
  type AdminBookingListItem,
  type AdminBookingDetailData,
  type AdminBookingsFilterParams,
} from '@/app/actions/admin-bookings-actions';
import { BookingStatus, PaymentStatus } from '@prisma/client';

interface AdminBookingsViewProps {
  initialData: AdminBookingsData;
}

export function AdminBookingsView({ initialData }: AdminBookingsViewProps) {
  const [bookings, setBookings] = React.useState<AdminBookingListItem[]>(initialData.bookings);
  const [metrics, setMetrics] = React.useState(initialData.metrics);
  const { providers, students } = initialData;

  // Pagination & Server Filter states
  const [totalCount, setTotalCount] = React.useState(initialData.totalCount ?? initialData.bookings.length);
  const [totalPages, setTotalPages] = React.useState(initialData.totalPages ?? 1);
  const [currentPage, setCurrentPage] = React.useState(initialData.currentPage ?? 1);
  const [pageSize, setPageSize] = React.useState(initialData.pageSize ?? 10);
  const [isPending, startTransition] = React.useTransition();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'ALL' | BookingStatus>('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = React.useState<'ALL' | PaymentStatus>('ALL');
  const [providerFilter, setProviderFilter] = React.useState<string>('ALL');
  const [studentFilter, setStudentFilter] = React.useState<string>('ALL');
  const [dateFilter, setDateFilter] = React.useState<'ALL' | 'TODAY' | 'UPCOMING' | 'PAST' | '7D' | '30D'>('ALL');

  // Sorting
  const [sortField, setSortField] = React.useState<'createdAt' | 'scheduledAt' | 'amount'>('createdAt');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');

  // Inspection modal state
  const [selectedBookingForDetails, setSelectedBookingForDetails] = React.useState<AdminBookingListItem | null>(null);
  const [detailedBookingData, setDetailedBookingData] = React.useState<AdminBookingDetailData | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = React.useState(false);

  // Status update modal state
  const [editingBookingStatus, setEditingBookingStatus] = React.useState<AdminBookingListItem | null>(null);
  const [newStatus, setNewStatus] = React.useState<BookingStatus>(BookingStatus.CONFIRMED);
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);

  // Server-side data fetcher with optimistic responsiveness
  const loadData = React.useCallback(
    (overrides?: Partial<AdminBookingsFilterParams>) => {
      startTransition(async () => {
        try {
          const res = await getAdminBookingsData({
            searchQuery: overrides?.searchQuery !== undefined ? overrides.searchQuery : searchQuery,
            statusFilter: overrides?.statusFilter !== undefined ? overrides.statusFilter : statusFilter,
            paymentStatusFilter: overrides?.paymentStatusFilter !== undefined ? overrides.paymentStatusFilter : paymentStatusFilter,
            providerFilter: overrides?.providerFilter !== undefined ? overrides.providerFilter : providerFilter,
            studentFilter: overrides?.studentFilter !== undefined ? overrides.studentFilter : studentFilter,
            dateFilter: overrides?.dateFilter !== undefined ? overrides.dateFilter : dateFilter,
            sortField: overrides?.sortField !== undefined ? overrides.sortField : sortField,
            sortDirection: overrides?.sortDirection !== undefined ? overrides.sortDirection : sortDirection,
            page: overrides?.page !== undefined ? overrides.page : currentPage,
            pageSize: overrides?.pageSize !== undefined ? overrides.pageSize : pageSize,
          });
          setBookings(res.bookings);
          setTotalCount(res.totalCount);
          setTotalPages(res.totalPages);
          setCurrentPage(res.currentPage);
          setMetrics(res.metrics);
        } catch (err) {
          console.error('Failed to load bookings:', err);
          toast.error('Failed to refresh bookings from database.');
        }
      });
    },
    [searchQuery, statusFilter, paymentStatusFilter, providerFilter, studentFilter, dateFilter, sortField, sortDirection, currentPage, pageSize]
  );

  const loadDataRef = React.useRef(loadData);
  React.useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  // Debounced search query
  const isFirstRender = React.useRef(true);
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      loadDataRef.current({ searchQuery, page: 1 });
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleStatusChange = (newStatusVal: 'ALL' | BookingStatus) => {
    setStatusFilter(newStatusVal);
    loadData({ statusFilter: newStatusVal, page: 1 });
  };

  const handlePaymentStatusChange = (newPaymentStatus: 'ALL' | PaymentStatus) => {
    setPaymentStatusFilter(newPaymentStatus);
    loadData({ paymentStatusFilter: newPaymentStatus, page: 1 });
  };

  const handleProviderChange = (newProvider: string) => {
    setProviderFilter(newProvider);
    loadData({ providerFilter: newProvider, page: 1 });
  };

  const handleStudentChange = (newStudent: string) => {
    setStudentFilter(newStudent);
    loadData({ studentFilter: newStudent, page: 1 });
  };

  const handleDateChange = (newDate: 'ALL' | 'TODAY' | 'UPCOMING' | 'PAST' | '7D' | '30D') => {
    setDateFilter(newDate);
    loadData({ dateFilter: newDate, page: 1 });
  };

  const handleToggleSort = (field: 'createdAt' | 'scheduledAt' | 'amount') => {
    const newDirection = sortField === field ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'desc';
    setSortField(field);
    setSortDirection(newDirection);
    loadData({ sortField: field, sortDirection: newDirection, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    loadData({ page: newPage });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    loadData({ pageSize: newSize, page: 1 });
  };

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      statusFilter !== 'ALL' ||
      paymentStatusFilter !== 'ALL' ||
      providerFilter !== 'ALL' ||
      studentFilter !== 'ALL' ||
      dateFilter !== 'ALL'
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setPaymentStatusFilter('ALL');
    setProviderFilter('ALL');
    setStudentFilter('ALL');
    setDateFilter('ALL');
    setCurrentPage(1);
    loadData({
      searchQuery: '',
      statusFilter: 'ALL',
      paymentStatusFilter: 'ALL',
      providerFilter: 'ALL',
      studentFilter: 'ALL',
      dateFilter: 'ALL',
      page: 1,
    });
  };

  // Inspect booking details
  const handleOpenDetails = async (booking: AdminBookingListItem) => {
    setSelectedBookingForDetails(booking);
    setIsLoadingDetails(true);
    setDetailedBookingData(null);

    try {
      const details = await getAdminBookingDetails(booking.id);
      setDetailedBookingData(details);
    } catch (err) {
      console.error('[handleOpenDetails error]:', err);
      toast.error('Failed to load full booking inspection details.');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Open status change modal
  const handleOpenStatusEdit = (booking: AdminBookingListItem) => {
    setEditingBookingStatus(booking);
    setNewStatus(booking.status);
  };

  // Submit status change
  const handleConfirmStatusChange = async () => {
    if (!editingBookingStatus) return;

    setIsUpdatingStatus(true);

    try {
      const result = await adminUpdateBookingStatusAction(editingBookingStatus.id, newStatus);

      if (!result.success || !result.booking) {
        toast.error(result.error || 'Failed to update booking status.');
        setIsUpdatingStatus(false);
        return;
      }

      const updatedList = bookings.map((b) => {
        if (b.id === editingBookingStatus.id) {
          return {
            ...b,
            status: result.booking!.status,
            updatedAt: result.booking!.updatedAt,
          };
        }
        return b;
      });

      setBookings(updatedList);

      // Recalculate metrics
      setMetrics({
        ...metrics,
        pendingBookings: updatedList.filter((b) => b.status === BookingStatus.PENDING).length,
        confirmedBookings: updatedList.filter((b) => b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.IN_PROGRESS).length,
        completedBookings: updatedList.filter((b) => b.status === BookingStatus.COMPLETED).length,
        cancelledBookings: updatedList.filter((b) => b.status === BookingStatus.CANCELLED || b.status === BookingStatus.REJECTED).length,
      });

      toast.success(`Booking ${editingBookingStatus.bookingCode} marked as ${newStatus}`, {
        description: 'Audit log and status updated.',
      });

      setEditingBookingStatus(null);
      loadData();
    } catch (err: unknown) {
      console.error('[handleConfirmStatusChange error]:', err);
      toast.error('An unexpected error occurred while modifying booking status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.COMPLETED:
        return (
          <Badge variant="glow" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1">
            <CheckCircle2 className="h-2.5 w-2.5" />
            <span>Completed</span>
          </Badge>
        );
      case BookingStatus.CONFIRMED:
        return (
          <Badge variant="glow" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/30 gap-1">
            <Clock className="h-2.5 w-2.5" />
            <span>Confirmed</span>
          </Badge>
        );
      case BookingStatus.IN_PROGRESS:
        return (
          <Badge variant="glow" className="text-[10px] bg-indigo-500/10 text-indigo-400 border-indigo-500/30 gap-1">
            <Clock className="h-2.5 w-2.5 animate-spin" />
            <span>In Progress</span>
          </Badge>
        );
      case BookingStatus.PENDING:
        return (
          <Badge variant="secondary" className="text-[10px] text-amber-500 bg-amber-500/10 border-amber-500/30 gap-1">
            <Clock className="h-2.5 w-2.5" />
            <span>Pending Review</span>
          </Badge>
        );
      case BookingStatus.CANCELLED:
        return (
          <Badge variant="secondary" className="text-[10px] text-muted-foreground bg-muted border-border gap-1">
            <XCircle className="h-2.5 w-2.5" />
            <span>Cancelled</span>
          </Badge>
        );
      case BookingStatus.REJECTED:
        return (
          <Badge variant="destructive" className="text-[10px] gap-1">
            <AlertCircle className="h-2.5 w-2.5" />
            <span>Rejected</span>
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: PaymentStatus, amount: number) => {
    if (amount === 0) {
      return (
        <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30 bg-emerald-500/5">
          Free Amenity
        </Badge>
      );
    }
    switch (status) {
      case PaymentStatus.SUCCESSFUL:
        return (
          <Badge variant="glow" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1">
            <CheckCircle2 className="h-2.5 w-2.5" />
            <span>Paid</span>
          </Badge>
        );
      case PaymentStatus.PENDING:
        return (
          <Badge variant="secondary" className="text-[10px] text-amber-500 bg-amber-500/10 border-amber-500/30 gap-1">
            <Clock className="h-2.5 w-2.5" />
            <span>Payment Pending</span>
          </Badge>
        );
      case PaymentStatus.REFUNDED:
        return (
          <Badge variant="secondary" className="text-[10px] text-indigo-400 bg-indigo-500/10 border-indigo-500/30 gap-1">
            <RefreshCw className="h-2.5 w-2.5" />
            <span>Refunded</span>
          </Badge>
        );
      case PaymentStatus.FAILED:
        return (
          <Badge variant="destructive" className="text-[10px] gap-1">
            <AlertCircle className="h-2.5 w-2.5" />
            <span>Failed</span>
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Campus Bookings & Orders Queue
            </h1>
            <Badge variant="glow" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Central Queue
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            University-wide master ledger of student service orders, payment transactions, schedule slots, and fulfillment states.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-3 py-1 font-mono">
            {metrics.totalBookings} Total Bookings Recorded
          </Badge>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 sm:gap-4">
        <Card className="p-4 space-y-1 bg-card/60 border-border/60 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total Orders</span>
            <Inbox className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-extrabold text-foreground">{metrics.totalBookings}</p>
          <span className="text-[10px] text-muted-foreground">Recorded in database</span>
        </Card>

        <Card className="p-4 space-y-1 bg-card/60 border-border/60 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Confirmed</span>
            <Clock className="h-4 w-4 text-blue-400" />
          </div>
          <p className="text-2xl font-extrabold text-blue-400">{metrics.confirmedBookings}</p>
          <span className="text-[10px] text-muted-foreground">Active work orders</span>
        </Card>

        <Card className="p-4 space-y-1 bg-card/60 border-border/60 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Pending Review</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-amber-400">{metrics.pendingBookings}</p>
          <span className="text-[10px] text-muted-foreground">Awaiting vendor check</span>
        </Card>

        <Card className="p-4 space-y-1 bg-card/60 border-border/60 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Fulfilled</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-400">{metrics.completedBookings}</p>
          <span className="text-[10px] text-muted-foreground">Completed services</span>
        </Card>

        <Card className="p-4 space-y-1 bg-card/60 border-border/60 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Cancelled</span>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-extrabold text-muted-foreground">{metrics.cancelledBookings}</p>
          <span className="text-[10px] text-muted-foreground">Released slots</span>
        </Card>

        <Card className="p-4 space-y-1 bg-card/60 border-border/60 backdrop-blur-xl col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total Revenue</span>
            <DollarSign className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-extrabold text-indigo-400">₹{metrics.totalRevenue.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-muted-foreground">{metrics.successfulPaymentsCount} paid orders</span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Booking ID, student, service, or vendor..."
                className="w-full rounded-xl border border-border/80 bg-background/80 pl-9 pr-9 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-mono"
              />
              {isPending ? (
                <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-primary" />
              ) : searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-muted-foreground hover:text-foreground font-sans"
                >
                  ✕
                </button>
              ) : null}
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Provider Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Provider:</span>
                <select
                  value={providerFilter}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  className="rounded-xl border border-border/80 bg-background/80 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 max-w-[150px] truncate"
                >
                  <option value="ALL">All Providers</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Student Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Student:</span>
                <select
                  value={studentFilter}
                  onChange={(e) => handleStudentChange(e.target.value)}
                  className="rounded-xl border border-border/80 bg-background/80 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 max-w-[150px] truncate"
                >
                  <option value="ALL">All Students</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Payment Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Payment:</span>
                <select
                  value={paymentStatusFilter}
                  onChange={(e) => handlePaymentStatusChange(e.target.value as typeof paymentStatusFilter)}
                  className="rounded-xl border border-border/80 bg-background/80 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="ALL">All Payments</option>
                  <option value={PaymentStatus.SUCCESSFUL}>Paid (Successful)</option>
                  <option value={PaymentStatus.PENDING}>Pending</option>
                  <option value={PaymentStatus.REFUNDED}>Refunded</option>
                  <option value={PaymentStatus.FAILED}>Failed</option>
                </select>
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Date:</span>
                <select
                  value={dateFilter}
                  onChange={(e) => handleDateChange(e.target.value as typeof dateFilter)}
                  className="rounded-xl border border-border/80 bg-background/80 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="ALL">All Dates</option>
                  <option value="TODAY">Scheduled Today</option>
                  <option value="UPCOMING">Upcoming</option>
                  <option value="PAST">Past</option>
                  <option value="7D">Past 7 Days</option>
                  <option value="30D">Past 30 Days</option>
                </select>
              </div>
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-border/40 pt-3">
            <span className="text-xs font-semibold text-muted-foreground mr-1 whitespace-nowrap">
              Booking Status:
            </span>
            <Button
              variant={statusFilter === 'ALL' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange('ALL')}
              className="h-7 text-xs px-2.5 font-medium rounded-lg"
            >
              All ({metrics.totalBookings})
            </Button>
            <Button
              variant={statusFilter === BookingStatus.CONFIRMED ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange(BookingStatus.CONFIRMED)}
              className="h-7 text-xs px-2.5 font-medium rounded-lg"
            >
              Confirmed ({metrics.confirmedBookings})
            </Button>
            <Button
              variant={statusFilter === BookingStatus.PENDING ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange(BookingStatus.PENDING)}
              className="h-7 text-xs px-2.5 font-medium rounded-lg"
            >
              Pending ({metrics.pendingBookings})
            </Button>
            <Button
              variant={statusFilter === BookingStatus.COMPLETED ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange(BookingStatus.COMPLETED)}
              className="h-7 text-xs px-2.5 font-medium rounded-lg"
            >
              Completed ({metrics.completedBookings})
            </Button>
            <Button
              variant={statusFilter === BookingStatus.CANCELLED ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange(BookingStatus.CANCELLED)}
              className="h-7 text-xs px-2.5 font-medium rounded-lg"
            >
              Cancelled ({metrics.cancelledBookings})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Data Table */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-xl overflow-hidden shadow-xl">
        <CardHeader className="py-4 px-6 border-b border-border/60 flex flex-row items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span>Campus Bookings Ledger</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Showing {bookings.length} of {totalCount} filtered work orders.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="rounded-lg border border-border/80 bg-background/80 px-2 py-1 text-xs text-foreground focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </CardHeader>

        {/* MOBILE CARD VIEW (Block on mobile, hidden on md+) */}
        <div className="block md:hidden">
          {bookings.length === 0 ? (
            <div className="p-6">
              <EmptyState
                compact
                icon={CalendarDays}
                title="No campus bookings found"
                description={
                  hasActiveFilters
                    ? 'No booking records match your active search or filter selection. Try clearing filters.'
                    : 'No booking transactions found in this audit log.'
                }
                actionLabel={hasActiveFilters ? 'Reset Filters' : undefined}
                onAction={hasActiveFilters ? handleResetFilters : undefined}
              />
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {bookings.map((b) => (
                <div key={b.id} className="p-4 space-y-3 bg-card/40">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <span className="font-mono text-xs font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/60">
                        {b.bookingCode}
                      </span>
                      <p className="text-sm font-bold text-foreground truncate mt-1">
                        {b.service?.name || 'Service Booking'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {getStatusBadge(b.status)}
                      {getPaymentBadge(b.paymentStatus, b.amount)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1 border-t border-border/30">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Student</span>
                      <span className="text-foreground/90 font-medium truncate block">
                        {b.student?.name || b.student?.email}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Provider</span>
                      <span className="text-foreground/90 font-medium truncate block">
                        {b.service?.provider?.name || 'Campus Desk'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Scheduled Time</span>
                      <span className="text-foreground/90 font-medium block">
                        {b.formattedScheduledDate}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{b.slotTime}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Amount</span>
                      <span className="font-mono font-bold text-foreground">
                        {b.amount === 0 ? 'FREE' : `₹${b.amount.toLocaleString('en-IN')}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDetails(b)}
                      className="flex-1 text-xs h-8 gap-1 rounded-xl"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Inspect Details</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenStatusEdit(b)}
                      className="text-xs h-8 px-3 rounded-xl text-primary border-primary/30"
                    >
                      <span>Status</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DESKTOP TABLE VIEW (Hidden on mobile, block on md+) */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-bold text-foreground">Booking ID</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Student</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Service & Vendor</TableHead>
                <TableHead className="text-xs font-bold text-foreground cursor-pointer select-none" onClick={() => handleToggleSort('scheduledAt')}>
                  <div className="flex items-center gap-1">
                    <span>Scheduled Slot</span>
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </TableHead>
                <TableHead className="text-xs font-bold text-foreground cursor-pointer select-none" onClick={() => handleToggleSort('amount')}>
                  <div className="flex items-center gap-1">
                    <span>Amount</span>
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </TableHead>
                <TableHead className="text-xs font-bold text-foreground">Payment</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Status</TableHead>
                <TableHead className="text-xs font-bold text-foreground cursor-pointer select-none" onClick={() => handleToggleSort('createdAt')}>
                  <div className="flex items-center gap-1">
                    <span>Created</span>
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </TableHead>
                <TableHead className="text-xs font-bold text-foreground text-right">Inspect</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.length === 0 ? (
                <TableEmptyState
                  colSpan={9}
                  title="No campus bookings found"
                  description={
                    hasActiveFilters
                      ? 'No booking records match your active search or filter selection. Try clearing filters.'
                      : 'No booking transactions found in this audit log.'
                  }
                  actionLabel={hasActiveFilters ? 'Reset Filters' : undefined}
                  onAction={hasActiveFilters ? handleResetFilters : undefined}
                />
              ) : (
                bookings.map((b) => (
                  <TableRow key={b.id} className="hover:bg-muted/30 transition-colors">
                    {/* Booking ID */}
                    <TableCell className="font-mono text-xs font-bold text-foreground py-3">
                      <span className="bg-muted/60 px-2 py-0.5 rounded-md border border-border/60">
                        {b.bookingCode}
                      </span>
                    </TableCell>

                    {/* Student */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-[11px] font-bold text-white shrink-0">
                          {(b.student?.name || b.student?.email || 'S').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-foreground line-clamp-1">
                            {b.student?.name || 'Campus Student'}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[130px]">
                            {b.student?.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Service & Provider */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-foreground line-clamp-1 block">
                          {b.service.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-2.5 w-2.5 text-indigo-400 shrink-0" />
                          <span className="line-clamp-1">{b.service.provider?.name || 'Vendor Desk'}</span>
                        </span>
                      </div>
                    </TableCell>

                    {/* Scheduled Slot */}
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span className="font-semibold text-foreground">
                          {b.formattedScheduledDate}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {b.slotTime || 'Standard Schedule'}
                        </span>
                      </div>
                    </TableCell>

                    {/* Amount */}
                    <TableCell>
                      <span className="font-bold text-xs text-foreground">
                        {b.amount === 0 ? 'Free' : `₹${b.amount}`}
                      </span>
                    </TableCell>

                    {/* Payment Status */}
                    <TableCell>
                      {getPaymentBadge(b.paymentStatus, b.amount)}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {getStatusBadge(b.status)}
                    </TableCell>

                    {/* Created Audit */}
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      <span className="font-mono text-[11px] block">{b.formattedCreatedAt}</span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetails(b)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          title="Inspect Booking Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenStatusEdit(b)}
                          className="h-7 px-2 text-[11px] font-medium"
                          title="Update Booking Status"
                        >
                          Action
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Bar */}
        {totalCount > 0 && (
          <div className="py-4 px-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <div>
              Showing <strong className="text-foreground">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
              <strong className="text-foreground">{Math.min(currentPage * pageSize, totalCount)}</strong> of{' '}
              <strong className="text-foreground">{totalCount}</strong> bookings
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(1)}
                className="h-8 w-8 p-0"
                title="First Page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                className="h-8 w-8 p-0"
                title="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="px-2 text-xs font-semibold text-foreground">
                Page {currentPage} of {totalPages}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                className="h-8 w-8 p-0"
                title="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(totalPages)}
                className="h-8 w-8 p-0"
                title="Last Page"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Booking Details Inspection Dialog */}
      <Dialog open={selectedBookingForDetails !== null} onOpenChange={(open) => !open && setSelectedBookingForDetails(null)}>
        <DialogContent className="max-w-2xl rounded-2xl border-border bg-card p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="space-y-2 border-b border-border/50 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                <DialogTitle className="text-lg font-bold font-mono">
                  {selectedBookingForDetails?.bookingCode}
                </DialogTitle>
              </div>
              <div className="flex items-center gap-2">
                {selectedBookingForDetails && getStatusBadge(selectedBookingForDetails.status)}
                {selectedBookingForDetails && getPaymentBadge(selectedBookingForDetails.paymentStatus, selectedBookingForDetails.amount)}
              </div>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Complete administrative inspection of student identity, vendor desk, payment transaction, and audit timestamps.
            </DialogDescription>
          </DialogHeader>

          {selectedBookingForDetails && (
            <div className="space-y-6 pt-3 text-xs">
              {/* Service & Schedule Box */}
              <div className="p-4 rounded-xl border border-border/60 bg-muted/30 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-foreground">{selectedBookingForDetails.service.name}</h3>
                  <span className="font-extrabold text-sm text-foreground">
                    {selectedBookingForDetails.amount === 0 ? 'Free' : `₹${selectedBookingForDetails.amount}`}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground pt-1">
                  <div>
                    <span className="text-[10px] block text-muted-foreground uppercase">Scheduled Slot</span>
                    <strong className="text-foreground">{selectedBookingForDetails.formattedScheduledDate} ({selectedBookingForDetails.slotTime || 'Standard'})</strong>
                  </div>
                  <div>
                    <span className="text-[10px] block text-muted-foreground uppercase">Physical Location</span>
                    <strong className="text-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-indigo-400" />
                      <span>{selectedBookingForDetails.location || 'Campus Facilities'}</span>
                    </strong>
                  </div>
                </div>
                {selectedBookingForDetails.notes && (
                  <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground">Student Notes: </span>
                    <span>&ldquo;{selectedBookingForDetails.notes}&rdquo;</span>
                  </div>
                )}
              </div>

              {/* Student & Provider Coordinates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Student */}
                <div className="p-3.5 rounded-xl border border-border/50 bg-background/50 space-y-2">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-blue-400" />
                    <span>Student Information</span>
                  </h4>
                  <div className="space-y-1">
                    <p className="font-bold text-foreground text-xs">{selectedBookingForDetails.student?.name || 'Campus Student'}</p>
                    <p className="text-muted-foreground text-[11px]">{selectedBookingForDetails.student?.email}</p>
                    {selectedBookingForDetails.student?.phone && (
                      <p className="font-mono text-xs text-foreground/80">{selectedBookingForDetails.student?.phone}</p>
                    )}
                  </div>
                </div>

                {/* Provider */}
                <div className="p-3.5 rounded-xl border border-border/50 bg-background/50 space-y-2">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Vendor / Provider Desk</span>
                  </h4>
                  <div className="space-y-1">
                    <p className="font-bold text-foreground text-xs">{selectedBookingForDetails.service.provider?.name || 'Central Facility Desk'}</p>
                    <p className="text-muted-foreground text-[11px]">{selectedBookingForDetails.service.provider?.email}</p>
                    {selectedBookingForDetails.service.provider?.phone && (
                      <p className="font-mono text-xs text-foreground/80">{selectedBookingForDetails.service.provider?.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Status & Gateway Transaction Details */}
              <div className="p-4 rounded-xl border border-border/50 bg-background/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Payment & Transaction Audit</span>
                  </h4>
                  {getPaymentBadge(selectedBookingForDetails.paymentStatus, selectedBookingForDetails.amount)}
                </div>

                {isLoadingDetails ? (
                  <div className="py-4 flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>Loading payment transactions...</span>
                  </div>
                ) : detailedBookingData?.allPayments && detailedBookingData.allPayments.length > 0 ? (
                  <div className="space-y-2">
                    {detailedBookingData.allPayments.map((p) => (
                      <div key={p.id} className="p-2.5 rounded-lg border border-border/40 bg-muted/20 font-mono text-[11px] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">Ref: {p.paymentCode}</span>
                          <span className="font-bold text-xs text-foreground">₹{p.amount} {p.currency}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-muted-foreground text-[10px]">
                          <span>Method: <strong className="text-foreground">{p.method}</strong></span>
                          {p.transactionId && <span>Gateway Tx: <strong className="text-foreground select-all">{p.transactionId}</strong></span>}
                          {p.orderId && <span>Order: <strong className="text-foreground select-all">{p.orderId}</strong></span>}
                          {p.paidAt && <span>Paid At: {new Date(p.paidAt).toLocaleTimeString()}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    {selectedBookingForDetails.amount === 0 ? 'University complimentary amenity (no gateway transaction required).' : 'No electronic payment receipt recorded.'}
                  </p>
                )}
              </div>

              {/* Customer Review (if present) */}
              {selectedBookingForDetails.review && (
                <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span>Student Feedback: {selectedBookingForDetails.review.rating} / 5.0 Stars</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(selectedBookingForDetails.review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {selectedBookingForDetails.review.comment && (
                    <p className="text-xs text-foreground/90 italic">
                      &ldquo;{selectedBookingForDetails.review.comment}&rdquo;
                    </p>
                  )}
                </div>
              )}

              {/* Audit Timestamps */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border border-border/50 bg-background/50 font-mono text-[11px]">
                <div>
                  <span className="text-muted-foreground text-[10px] block">RECORD CREATED</span>
                  <span className="text-foreground select-all">{selectedBookingForDetails.formattedCreatedAt}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] block">LAST MODIFIED</span>
                  <span className="text-foreground select-all">{selectedBookingForDetails.formattedUpdatedAt}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedBookingForDetails(null)}
              className="text-xs"
            >
              Close
            </Button>
            {selectedBookingForDetails && (
              <Button
                variant="gradient"
                size="sm"
                onClick={() => {
                  const target = selectedBookingForDetails;
                  setSelectedBookingForDetails(null);
                  handleOpenStatusEdit(target);
                }}
                className="text-xs font-semibold gap-1.5"
              >
                <span>Update Status</span>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Administrative Status Modification Modal */}
      <Dialog open={editingBookingStatus !== null} onOpenChange={(open) => !open && !isUpdatingStatus && setEditingBookingStatus(null)}>
        <DialogContent className="max-w-md rounded-2xl border-border bg-card p-6 shadow-2xl">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <Clock className="h-5 w-5" />
              <DialogTitle className="text-lg font-bold">
                Update Booking Status
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Modify the operational status for booking <strong className="text-foreground font-mono">{editingBookingStatus?.bookingCode}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Target Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as BookingStatus)}
                className="w-full rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value={BookingStatus.PENDING}>PENDING (Awaiting Review)</option>
                <option value={BookingStatus.CONFIRMED}>CONFIRMED (Reservation Scheduled)</option>
                <option value={BookingStatus.IN_PROGRESS}>IN_PROGRESS (Fulfillment Underway)</option>
                <option value={BookingStatus.COMPLETED}>COMPLETED (Service Rendered)</option>
                <option value={BookingStatus.CANCELLED}>CANCELLED (Slot Released)</option>
                <option value={BookingStatus.REJECTED}>REJECTED (Declined)</option>
              </select>
            </div>

            <div className="p-3 rounded-xl border border-border/50 bg-muted/20 text-muted-foreground text-[11px] space-y-1">
              <span className="font-semibold text-foreground">Audit Notice: </span>
              <span>Updating this work order immediately notifies the student and provider dashboards, recalculating operational metrics.</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              disabled={isUpdatingStatus}
              onClick={() => setEditingBookingStatus(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              size="sm"
              disabled={isUpdatingStatus}
              onClick={handleConfirmStatusChange}
              className="gap-1.5 text-xs font-semibold"
            >
              {isUpdatingStatus ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Save Status</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
