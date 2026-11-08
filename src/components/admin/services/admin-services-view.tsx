'use client';

import * as React from 'react';
import {
  Grid,
  Search,
  ShieldCheck,
  Building2,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Inbox,
  Star,
  MapPin,
  AlertTriangle,
  Loader2,
  Power,
  DollarSign,
  ChevronLeft,
  ChevronRight,
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
  getAdminServicesData,
  adminToggleServiceStatusAction,
  adminEditServiceAction,
  adminRemoveServiceAction,
  getAdminServiceDetails,
  type AdminServicesData,
  type AdminServiceListItem,
  type AdminServiceDetailsData,
  type AdminEditServiceInput,
  type AdminServicesFilterParams,
} from '@/app/actions/admin-services-actions';

interface AdminServicesViewProps {
  initialData: AdminServicesData;
}

export function AdminServicesView({ initialData }: AdminServicesViewProps) {
  const [services, setServices] = React.useState<AdminServiceListItem[]>(initialData.services);
  const [metrics, setMetrics] = React.useState(initialData.metrics);
  const categories = initialData.categories;

  // Pagination & Server Filter states
  const [totalCount, setTotalCount] = React.useState(initialData.totalCount ?? initialData.services.length);
  const [totalPages, setTotalPages] = React.useState(initialData.totalPages ?? 1);
  const [currentPage, setCurrentPage] = React.useState(initialData.currentPage ?? 1);
  const [pageSize, setPageSize] = React.useState(initialData.pageSize ?? 10);
  const [isPending, startTransition] = React.useTransition();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('ALL');
  const [pricingFilter, setPricingFilter] = React.useState<'ALL' | 'FREE' | 'PAID'>('ALL');

  // Server-side data fetcher
  const loadData = React.useCallback(
    (overrides?: Partial<AdminServicesFilterParams>) => {
      startTransition(async () => {
        try {
          const res = await getAdminServicesData({
            searchQuery: overrides?.searchQuery !== undefined ? overrides.searchQuery : searchQuery,
            categoryFilter: overrides?.categoryFilter !== undefined ? overrides.categoryFilter : categoryFilter,
            statusFilter: overrides?.statusFilter !== undefined ? overrides.statusFilter : statusFilter,
            page: overrides?.page !== undefined ? overrides.page : currentPage,
            pageSize: overrides?.pageSize !== undefined ? overrides.pageSize : pageSize,
          });
          setServices(res.services);
          setTotalCount(res.totalCount);
          setTotalPages(res.totalPages);
          setCurrentPage(res.currentPage);
          setMetrics(res.metrics);
        } catch (err) {
          console.error('Failed to load services:', err);
          toast.error('Failed to refresh services from database.');
        }
      });
    },
    [searchQuery, categoryFilter, statusFilter, currentPage, pageSize]
  );

  const loadDataRef = React.useRef(loadData);
  React.useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

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

  const handleStatusChange = (newStatus: 'ALL' | 'ACTIVE' | 'INACTIVE') => {
    setStatusFilter(newStatus);
    loadData({ statusFilter: newStatus, page: 1 });
  };

  const handleCategoryChange = (newCat: string) => {
    setCategoryFilter(newCat);
    loadData({ categoryFilter: newCat, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    loadData({ page: newPage });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    loadData({ pageSize: newSize, page: 1 });
  };

  const hasActiveFilters = Boolean(
    searchQuery.trim() || statusFilter !== 'ALL' || categoryFilter !== 'ALL' || pricingFilter !== 'ALL'
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
    setPricingFilter('ALL');
    setCurrentPage(1);
    loadData({ searchQuery: '', statusFilter: 'ALL', categoryFilter: 'ALL', page: 1 });
  };

  // Inspection modal state
  const [selectedServiceDetails, setSelectedServiceDetails] = React.useState<AdminServiceListItem | null>(null);
  const [detailedData, setDetailedData] = React.useState<AdminServiceDetailsData | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = React.useState(false);

  // Edit service modal state
  const [editingService, setEditingService] = React.useState<AdminServiceListItem | null>(null);
  const [editFormData, setEditFormData] = React.useState<AdminEditServiceInput>({
    serviceId: '',
    name: '',
    description: '',
    categoryId: null,
    price: 0,
    durationMinutes: 30,
    location: '',
    capacity: 1,
    isActive: true,
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = React.useState(false);

  // Status toggle confirmation modal state
  const [togglingService, setTogglingService] = React.useState<AdminServiceListItem | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = React.useState(false);

  // Destructive removal confirmation modal state
  const [removingService, setRemovingService] = React.useState<AdminServiceListItem | null>(null);
  const [removalReason, setRemovalReason] = React.useState('');
  const [isRemoving, setIsRemoving] = React.useState(false);


  // Load service full details when detail modal opens
  const handleOpenDetails = async (service: AdminServiceListItem) => {
    setSelectedServiceDetails(service);
    setIsLoadingDetails(true);
    setDetailedData(null);

    try {
      const details = await getAdminServiceDetails(service.id);
      setDetailedData(details);
    } catch (err) {
      console.error('[handleOpenDetails error]:', err);
      toast.error('Failed to load full service details.');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Open Edit Service Modal
  const handleOpenEdit = (service: AdminServiceListItem) => {
    setEditingService(service);
    setEditFormData({
      serviceId: service.id,
      name: service.name,
      description: service.description || '',
      categoryId: service.category?.id || null,
      price: service.price,
      durationMinutes: service.durationMinutes,
      location: service.location || '',
      capacity: service.capacity,
      isActive: service.isActive,
    });
  };

  // Submit Edit Service
  const handleSaveServiceChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    setIsSubmittingEdit(true);

    try {
      const result = await adminEditServiceAction(editFormData);

      if (!result.success || !result.service) {
        toast.error(result.error || 'Failed to update service.');
        setIsSubmittingEdit(false);
        return;
      }

      // Update local state smoothly
      const updatedList = services.map((s) => {
        if (s.id === editingService.id) {
          const selectedCat = categories.find((c) => c.id === editFormData.categoryId);
          return {
            ...s,
            name: editFormData.name,
            description: editFormData.description || null,
            price: editFormData.price,
            durationMinutes: editFormData.durationMinutes,
            location: editFormData.location || null,
            capacity: editFormData.capacity || 1,
            isActive: editFormData.isActive,
            updatedAt: result.service!.updatedAt,
            category: selectedCat ? { id: selectedCat.id, name: selectedCat.name, slug: selectedCat.slug, icon: null } : s.category,
          };
        }
        return s;
      });

      setServices(updatedList);
      setEditingService(null);
      toast.success('Service updated successfully!', {
        description: `Audit timestamp refreshed: ${new Date().toLocaleTimeString()}`,
      });
    } catch (err: unknown) {
      console.error('[handleSaveServiceChanges error]:', err);
      toast.error('An unexpected error occurred while updating the service.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Toggle Service Active Status Confirmation
  const handleConfirmToggleStatus = async () => {
    if (!togglingService) return;

    setIsTogglingStatus(true);
    const newStatus = !togglingService.isActive;

    try {
      const result = await adminToggleServiceStatusAction(togglingService.id, newStatus);

      if (!result.success || !result.service) {
        toast.error(result.error || 'Failed to update status.');
        setIsTogglingStatus(false);
        return;
      }

      const updatedList = services.map((s) => {
        if (s.id === togglingService.id) {
          return {
            ...s,
            isActive: newStatus,
            updatedAt: result.service!.updatedAt,
          };
        }
        return s;
      });

      setServices(updatedList);
      setMetrics({
        ...metrics,
        activeServices: updatedList.filter((s) => s.isActive).length,
        inactiveServices: updatedList.filter((s) => !s.isActive).length,
      });

      toast.success(
        newStatus ? `Service "${togglingService.name}" is now Active` : `Service "${togglingService.name}" deactivated`,
        { description: 'Students catalog visibility updated immediately.' }
      );

      setTogglingService(null);
    } catch (err: unknown) {
      console.error('[handleConfirmToggleStatus error]:', err);
      toast.error('Failed to change service status.');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Destructive Removal
  const handleConfirmRemoval = async () => {
    if (!removingService) return;

    setIsRemoving(true);

    try {
      const result = await adminRemoveServiceAction(removingService.id, removalReason);

      if (!result.success) {
        toast.error(result.error || 'Failed to remove service.');
        setIsRemoving(false);
        return;
      }

      const updatedList = services.filter((s) => s.id !== removingService.id);
      setServices(updatedList);
      setMetrics({
        ...metrics,
        totalServices: updatedList.length,
        activeServices: updatedList.filter((s) => s.isActive).length,
        inactiveServices: updatedList.filter((s) => !s.isActive).length,
      });

      toast.success(`Service "${removingService.name}" removed permanently.`, {
        description: 'Provider has been notified and associated slots deleted.',
      });

      setRemovingService(null);
      setRemovalReason('');
    } catch (err: unknown) {
      console.error('[handleConfirmRemoval error]:', err);
      toast.error('An unexpected error occurred while deleting the service.');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Campus Services Directory & Moderation
            </h1>
            <Badge variant="glow" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Admin Moderation
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Audit university amenities, inspect provider operators, monitor bookings, edit service coordinates, and manage catalog status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-3 py-1 font-mono">
            {services.length} Total Services Listed
          </Badge>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 sm:gap-4">
        <Card className="p-4 space-y-1 bg-card/60 border-border/60 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total Services</span>
            <Grid className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-extrabold text-foreground">{metrics.totalServices}</p>
          <span className="text-[10px] text-muted-foreground">University catalog</span>
        </Card>

        <Card className="p-4 space-y-1 bg-card/60 border-border/60 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Active</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-400">{metrics.activeServices}</p>
          <span className="text-[10px] text-muted-foreground">Bookable by students</span>
        </Card>

        <Card className="p-4 space-y-1 bg-card/60 border-border/60 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Deactivated</span>
            <XCircle className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-amber-400">{metrics.inactiveServices}</p>
          <span className="text-[10px] text-muted-foreground">Paused by admin/vendor</span>
        </Card>

        <Card className="p-4 space-y-1 bg-card/60 border-border/60 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total Bookings</span>
            <Inbox className="h-4 w-4 text-blue-400" />
          </div>
          <p className="text-2xl font-extrabold text-blue-400">{metrics.totalBookingsAcrossServices}</p>
          <span className="text-[10px] text-muted-foreground">Student reservations</span>
        </Card>

        <Card className="p-4 space-y-1 bg-card/60 border-border/60 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total Revenue</span>
            <DollarSign className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-extrabold text-indigo-400">₹{metrics.totalRevenueAcrossServices.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-muted-foreground">Settled payments</span>
        </Card>

        <Card className="p-4 space-y-1 bg-card/60 border-border/60 backdrop-blur-xl col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Average Rating</span>
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-foreground">{metrics.averagePlatformRating} ★</p>
          <span className="text-[10px] text-muted-foreground">Student satisfaction</span>
        </Card>
      </div>

      {/* Search & Filter Controls */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              {isPending ? (
                <Loader2 className="absolute left-3 top-2.5 h-4 w-4 text-primary animate-spin" />
              ) : (
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              )}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services, providers, locations, categories..."
                className="w-full rounded-xl border border-border/80 bg-background/80 pl-9 pr-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="rounded-xl border border-border/80 bg-background/80 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pricing Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Pricing:</span>
                <select
                  value={pricingFilter}
                  onChange={(e) => setPricingFilter(e.target.value as typeof pricingFilter)}
                  className="rounded-xl border border-border/80 bg-background/80 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="ALL">All Pricing</option>
                  <option value="FREE">Free (₹0)</option>
                  <option value="PAID">Paid Services</option>
                </select>
              </div>
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-border/40 pt-3">
            <span className="text-xs font-semibold text-muted-foreground mr-1 whitespace-nowrap">
              Status:
            </span>
            <Button
              variant={statusFilter === 'ALL' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange('ALL')}
              className="h-7 text-xs px-2.5 font-medium rounded-lg"
            >
              All Services ({metrics.totalServices})
            </Button>
            <Button
              variant={statusFilter === 'ACTIVE' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange('ACTIVE')}
              className="h-7 text-xs px-2.5 font-medium rounded-lg"
            >
              Active ({metrics.activeServices})
            </Button>
            <Button
              variant={statusFilter === 'INACTIVE' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange('INACTIVE')}
              className="h-7 text-xs px-2.5 font-medium rounded-lg"
            >
              Deactivated ({metrics.inactiveServices})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-xl overflow-hidden shadow-xl">
        <CardHeader className="py-4 px-6 border-b border-border/60 flex flex-row items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Grid className="h-4 w-4 text-primary" />
              <span>Campus Services Catalog</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Showing {services.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-
              {Math.min(currentPage * pageSize, totalCount)} of {totalCount} services matching filters.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs gap-1">
            <Clock className="h-3 w-3 text-primary" />
            <span>Audit-Friendly Timestamps</span>
          </Badge>
        </CardHeader>

        {/* MOBILE CARD VIEW (Block on mobile, hidden on md+) */}
        <div className="block md:hidden">
          {services.length === 0 ? (
            <div className="p-6">
              <EmptyState
                compact
                icon={Grid}
                title="No campus services found"
                description={
                  hasActiveFilters
                    ? 'No services match your active search or filter selection. Try clearing filters.'
                    : 'No services currently listed in the campus database.'
                }
                actionLabel={hasActiveFilters ? 'Reset Filters' : undefined}
                onAction={hasActiveFilters ? handleResetFilters : undefined}
              />
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {services.map((svc) => (
                <div key={svc.id} className="p-4 space-y-3 bg-card/40">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-bold text-foreground truncate">{svc.name}</span>
                        {svc.category && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                            {svc.category.name}
                          </Badge>
                        )}
                      </div>
                      {svc.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 text-indigo-400 shrink-0" />
                          <span>{svc.location}</span>
                        </p>
                      )}
                    </div>
                    {svc.isActive ? (
                      <Badge variant="glow" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shrink-0">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] text-muted-foreground bg-muted/60 shrink-0">
                        Inactive
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1 border-t border-border/30">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Price & Duration</span>
                      <span className="font-semibold text-foreground">
                        {svc.price === 0 ? 'Free' : `₹${svc.price}`}
                      </span>
                      <span className="text-[11px] text-muted-foreground"> • {svc.durationMinutes}m</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Provider</span>
                      <span className="text-foreground/90 truncate block">{svc.provider?.name || 'Campus General'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Bookings</span>
                      <span className="font-semibold text-foreground">{svc.totalBookings} Total</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Rating</span>
                      <span className="flex items-center gap-1 text-amber-500 font-semibold">
                        <Star className="h-3 w-3 fill-amber-500" />
                        {svc.averageRating > 0 ? svc.averageRating.toFixed(1) : 'No reviews'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-border/30">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDetails(svc)}
                      className="flex-1 text-xs h-8 gap-1 rounded-xl"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Inspect</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(svc)}
                      className="flex-1 text-xs h-8 gap-1 rounded-xl"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTogglingService(svc)}
                      className={`h-8 px-2.5 text-xs rounded-xl ${
                        svc.isActive ? 'text-amber-500 hover:text-amber-600' : 'text-emerald-500 hover:text-emerald-600'
                      }`}
                      title={svc.isActive ? 'Deactivate' : 'Activate'}
                    >
                      <Power className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRemovingService(svc)}
                      className="h-8 px-2.5 text-xs rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      title="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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
                <TableHead className="text-xs font-bold text-foreground">Service Name & Category</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Provider</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Price & Duration</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Status</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Bookings</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Rating</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Last Audit Update</TableHead>
                <TableHead className="text-xs font-bold text-foreground text-right">Moderation Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.length === 0 ? (
                <TableEmptyState
                  colSpan={8}
                  title="No campus services found"
                  description={
                    hasActiveFilters
                      ? 'No services match your active search or filter selection. Try clearing filters.'
                      : 'No services currently listed in the campus database.'
                  }
                  actionLabel={hasActiveFilters ? 'Reset Filters' : undefined}
                  onAction={hasActiveFilters ? handleResetFilters : undefined}
                />
              ) : (
                services.map((svc) => (
                  <TableRow key={svc.id} className="hover:bg-muted/30 transition-colors">
                    {/* Service Name & Category */}
                    <TableCell className="py-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground line-clamp-1">{svc.name}</span>
                          {svc.category && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-medium">
                              {svc.category.name}
                            </Badge>
                          )}
                        </div>
                        {svc.location && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1 line-clamp-1">
                            <MapPin className="h-3 w-3 text-indigo-400 shrink-0" />
                            <span>{svc.location}</span>
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Provider */}
                    <TableCell>
                      {svc.provider ? (
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-blue-600 text-[11px] font-bold text-white shadow-sm shrink-0">
                            {(svc.provider.name || svc.provider.email).charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-foreground line-clamp-1">
                              {svc.provider.name || 'Vendor Partner'}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                              {svc.provider.email}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Campus General</span>
                      )}
                    </TableCell>

                    {/* Price & Duration */}
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span className="font-bold text-foreground">
                          {svc.price === 0 ? 'Free' : `₹${svc.price}`}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {svc.durationMinutes} mins • cap {svc.capacity}
                        </span>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <button
                        onClick={() => setTogglingService(svc)}
                        title={`Click to ${svc.isActive ? 'Deactivate' : 'Activate'}`}
                        className="cursor-pointer transition-transform hover:scale-105"
                      >
                        {svc.isActive ? (
                          <Badge variant="glow" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            <span>Active</span>
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] text-amber-500 bg-amber-500/10 border-amber-500/30 gap-1">
                            <XCircle className="h-2.5 w-2.5" />
                            <span>Deactivated</span>
                          </Badge>
                        )}
                      </button>
                    </TableCell>

                    {/* Bookings */}
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span className="font-bold text-foreground flex items-center gap-1">
                          <Inbox className="h-3 w-3 text-blue-500" />
                          <span>{svc.totalBookings} Bookings</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {svc.completedBookings} fulfilled
                        </span>
                      </div>
                    </TableCell>

                    {/* Rating */}
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-foreground">
                          {svc.averageRating > 0 ? svc.averageRating : '5.0'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">({svc.totalReviews})</span>
                      </div>
                    </TableCell>

                    {/* Audit Timestamps */}
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      <span className="block font-mono text-[11px] text-foreground/80">{svc.formattedUpdatedAt}</span>
                      <span className="text-[10px] text-muted-foreground block">Created {svc.formattedCreatedAt}</span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetails(svc)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          title="Inspect Service & Bookings"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(svc)}
                          className="h-8 px-2 text-xs font-medium gap-1"
                          title="Edit Service Details"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRemovingService(svc)}
                          className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                          title="Remove Inappropriate Service"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border/50 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="rounded-lg border border-border/70 bg-background px-2 py-1 text-xs text-foreground focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>
              Page {currentPage} of {totalPages} ({totalCount} total services)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || isPending}
              onClick={() => handlePageChange(currentPage - 1)}
              className="h-8 px-2.5 text-xs rounded-lg"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Previous
            </Button>
            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = Math.min(currentPage - 2 + i, totalPages - 4 + i);
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'ghost'}
                    size="sm"
                    disabled={isPending}
                    onClick={() => handlePageChange(pageNum)}
                    className="h-8 w-8 p-0 text-xs rounded-lg"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages || isPending}
              onClick={() => handlePageChange(currentPage + 1)}
              className="h-8 px-2.5 text-xs rounded-lg"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Service Details Inspection Dialog */}
      <Dialog open={selectedServiceDetails !== null} onOpenChange={(open) => !open && setSelectedServiceDetails(null)}>
        <DialogContent className="max-w-2xl rounded-2xl border-border bg-card p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="space-y-2 border-b border-border/50 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Grid className="h-5 w-5 text-primary" />
                <DialogTitle className="text-lg font-bold">
                  Service Inspection & Audit Record
                </DialogTitle>
              </div>
              {selectedServiceDetails && (
                <Badge variant={selectedServiceDetails.isActive ? 'success' : 'secondary'} className="text-xs">
                  {selectedServiceDetails.isActive ? 'Active' : 'Deactivated'}
                </Badge>
              )}
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Review full provider coordinates, student booking queue, ratings, and schedule slots.
            </DialogDescription>
          </DialogHeader>

          {selectedServiceDetails && (
            <div className="space-y-6 pt-3 text-xs">
              {/* Core Information */}
              <div className="p-4 rounded-xl border border-border/60 bg-muted/30 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-foreground">{selectedServiceDetails.name}</h3>
                  <span className="font-extrabold text-sm text-foreground">
                    {selectedServiceDetails.price === 0 ? 'Free' : `₹${selectedServiceDetails.price}`}
                  </span>
                </div>
                {selectedServiceDetails.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {selectedServiceDetails.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground pt-1">
                  <span>Duration: <strong className="text-foreground">{selectedServiceDetails.durationMinutes} mins</strong></span>
                  <span>Capacity: <strong className="text-foreground">{selectedServiceDetails.capacity} student/slot</strong></span>
                  {selectedServiceDetails.location && (
                    <span>Location: <strong className="text-foreground">{selectedServiceDetails.location}</strong></span>
                  )}
                </div>
              </div>

              {/* Provider Coordinates */}
              {selectedServiceDetails.provider && (
                <div className="p-3.5 rounded-xl border border-border/50 bg-background/50 space-y-2">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Operating Service Provider</span>
                  </h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-foreground text-xs">{selectedServiceDetails.provider.name || 'Campus Vendor'}</p>
                      <p className="text-muted-foreground text-[11px]">{selectedServiceDetails.provider.email}</p>
                    </div>
                    {selectedServiceDetails.provider.phone && (
                      <span className="font-mono text-xs text-foreground/80">{selectedServiceDetails.provider.phone}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamps Audit Box */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border border-border/50 bg-background/50 font-mono text-[11px]">
                <div>
                  <span className="text-muted-foreground text-[10px] block">CREATED AT (ISO-8601)</span>
                  <span className="text-foreground select-all">{selectedServiceDetails.formattedCreatedAt}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] block">LAST AUDIT MODIFIED</span>
                  <span className="text-foreground select-all">{selectedServiceDetails.formattedUpdatedAt}</span>
                </div>
              </div>

              {/* Recent Bookings and Reviews from Detailed Data */}
              <div className="space-y-4">
                {isLoadingDetails ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span>Loading service bookings and student reviews...</span>
                  </div>
                ) : detailedData ? (
                  <>
                    {/* Bookings Queue */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Inbox className="h-3.5 w-3.5 text-blue-500" />
                        <span>Recent Bookings ({detailedData.bookings.length})</span>
                      </h4>
                      {detailedData.bookings.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-1">No bookings made for this service yet.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {detailedData.bookings.map((b) => (
                            <div key={b.id} className="flex items-center justify-between p-2 rounded-lg border border-border/40 bg-background/40">
                              <div>
                                <span className="font-semibold text-foreground text-xs">{b.studentName}</span>
                                <span className="text-[10px] text-muted-foreground block font-mono">Ref: {b.bookingCode} • {b.scheduledAt}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-xs text-foreground block">₹{b.amount}</span>
                                <Badge variant="outline" className="text-[9px] px-1 py-0">{b.status}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Student Reviews */}
                    <div className="space-y-2 pt-2 border-t border-border/40">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 text-amber-400" />
                        <span>Student Reviews & Feedback ({detailedData.reviews.length})</span>
                      </h4>
                      {detailedData.reviews.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-1">No reviews submitted yet.</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {detailedData.reviews.map((r) => (
                            <div key={r.id} className="p-2.5 rounded-lg border border-border/40 bg-background/40 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-xs text-foreground">{r.studentName}</span>
                                <span className="text-amber-400 font-bold text-xs">{r.rating} ★</span>
                              </div>
                              {r.comment && (
                                <p className="text-[11px] text-muted-foreground italic">&ldquo;{r.comment}&rdquo;</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedServiceDetails(null)}
              className="text-xs"
            >
              Close
            </Button>
            {selectedServiceDetails && (
              <Button
                variant="gradient"
                size="sm"
                onClick={() => {
                  const target = selectedServiceDetails;
                  setSelectedServiceDetails(null);
                  handleOpenEdit(target);
                }}
                className="text-xs gap-1.5 font-semibold"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Edit Service</span>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Edit Service Modal */}
      <Dialog open={editingService !== null} onOpenChange={(open) => !open && !isSubmittingEdit && setEditingService(null)}>
        <DialogContent className="max-w-lg rounded-2xl border-border bg-card p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <Edit className="h-5 w-5" />
              <DialogTitle className="text-lg font-bold">
                Edit Campus Service
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Modify service parameters, pricing, duration, category, and catalog availability.
            </DialogDescription>
          </DialogHeader>

          {editingService && (
            <form onSubmit={handleSaveServiceChanges} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editFormData.description || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Category
                  </label>
                  <select
                    value={editFormData.categoryId || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, categoryId: e.target.value || null })}
                    className="w-full rounded-xl border border-border/80 bg-background/80 px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={editFormData.price}
                    onChange={(e) => setEditFormData({ ...editFormData, price: Number(e.target.value) })}
                    className="w-full rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Duration (Minutes) *
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="720"
                    step="5"
                    required
                    value={editFormData.durationMinutes}
                    onChange={(e) => setEditFormData({ ...editFormData, durationMinutes: Number(e.target.value) })}
                    className="w-full rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Capacity (Students per Slot)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={editFormData.capacity || 1}
                    onChange={(e) => setEditFormData({ ...editFormData, capacity: Number(e.target.value) })}
                    className="w-full rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Location / Facility Room
                </label>
                <input
                  type="text"
                  value={editFormData.location || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                  placeholder="e.g. SAC Room 102"
                  className="w-full rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editFormData.isActive}
                  onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="editIsActive" className="text-xs font-semibold text-foreground cursor-pointer">
                  Active (Visible and bookable in the student catalog)
                </label>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmittingEdit}
                  onClick={() => setEditingService(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  size="sm"
                  disabled={isSubmittingEdit}
                  className="gap-1.5 text-xs font-semibold"
                >
                  {isSubmittingEdit ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving Audit...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Save Service Changes</span>
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Status Toggle */}
      <Dialog open={togglingService !== null} onOpenChange={(open) => !open && !isTogglingStatus && setTogglingService(null)}>
        <DialogContent className="max-w-md rounded-2xl border-border bg-card p-6 shadow-2xl">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <Power className="h-5 w-5" />
              <DialogTitle className="text-lg font-bold">
                {togglingService?.isActive ? 'Deactivate Service?' : 'Activate Service?'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {togglingService?.isActive ? (
                <>
                  Deactivating <strong className="text-foreground">{togglingService?.name}</strong> will hide it from the student catalog. Existing confirmed bookings will remain intact.
                </>
              ) : (
                <>
                  Activating <strong className="text-foreground">{togglingService?.name}</strong> will restore its visibility in the student catalog and allow new reservations.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              disabled={isTogglingStatus}
              onClick={() => setTogglingService(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant={togglingService?.isActive ? 'destructive' : 'gradient'}
              size="sm"
              disabled={isTogglingStatus}
              onClick={handleConfirmToggleStatus}
              className="gap-1.5 text-xs font-semibold"
            >
              {isTogglingStatus ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Updating Status...</span>
                </>
              ) : (
                <>
                  <Power className="h-3.5 w-3.5" />
                  <span>{togglingService?.isActive ? 'Confirm Deactivation' : 'Confirm Activation'}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Destructive Removal */}
      <Dialog open={removingService !== null} onOpenChange={(open) => !open && !isRemoving && setRemovingService(null)}>
        <DialogContent className="max-w-md rounded-2xl border-border bg-card p-6 shadow-2xl">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2 text-rose-500">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle className="text-lg font-bold">
                Remove Inappropriate Service?
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              You are about to permanently delete{' '}
              <strong className="text-foreground">{removingService?.name}</strong>. This is a destructive administrative action that cascades to all associated availability slots.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-2 text-xs">
            <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-300 text-[11px] space-y-1">
              <p className="font-semibold text-rose-400">Audit & Provider Notification Notice:</p>
              <p>The service provider will automatically receive a high-priority system alert with your specified removal reason.</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Removal Reason (Logged for Audit & Sent to Provider)
              </label>
              <input
                type="text"
                value={removalReason}
                onChange={(e) => setRemovalReason(e.target.value)}
                placeholder="e.g. Violates campus facility guidelines / duplicate listing"
                className="w-full rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              disabled={isRemoving}
              onClick={() => {
                setRemovingService(null);
                setRemovalReason('');
              }}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isRemoving}
              onClick={handleConfirmRemoval}
              className="gap-1.5 text-xs font-semibold shadow-md shadow-rose-500/20"
            >
              {isRemoving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Removing Service...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Confirm Permanent Removal</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
