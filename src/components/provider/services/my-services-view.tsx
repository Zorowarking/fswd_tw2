'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Wrench,
  Plus,
  Search,
  CheckCircle2,
  MapPin,
  Users,
  MoreVertical,
  Edit2,
  Trash2,
  Power,
  Eye,
  Layers,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { ServiceDeleteDialog } from './service-delete-dialog';
import { ServiceStatusDialog } from './service-status-dialog';
import { ServiceEmptyState } from './service-empty-state';
import { CategoryIcon } from '@/components/categories/category-filter';
import {
  type ProviderServiceListItem,
  type ServiceCategoryOption,
  toggleServiceStatus,
  deleteService,
} from '@/app/actions/service-actions';
import { toast } from 'sonner';

interface MyServicesViewProps {
  initialServices: ProviderServiceListItem[];
  categories: ServiceCategoryOption[];
}

export function MyServicesView({ initialServices, categories }: MyServicesViewProps) {
  const [services, setServices] = React.useState<ProviderServiceListItem[]>(initialServices);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = React.useState<'newest' | 'price-asc' | 'price-desc' | 'capacity'>('newest');
  const [viewMode, setViewMode] = React.useState<'grid' | 'table'>('grid');

  // Dialog states
  const [serviceToDelete, setServiceToDelete] = React.useState<ProviderServiceListItem | null>(null);
  const [serviceToToggle, setServiceToToggle] = React.useState<ProviderServiceListItem | null>(null);

  // Derived metrics
  const totalServices = services.length;
  const activeCount = services.filter((s) => s.isActive).length;
  const inactiveCount = totalServices - activeCount;
  const totalBookingsCount = services.reduce((acc, curr) => acc + curr.totalBookings, 0);

  // Filter and sort services
  const filteredServices = React.useMemo(() => {
    return services
      .filter((service) => {
        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = service.name.toLowerCase().includes(q);
          const matchDesc = service.description?.toLowerCase().includes(q) || false;
          const matchLoc = service.location?.toLowerCase().includes(q) || false;
          const matchCat = service.categoryName?.toLowerCase().includes(q) || false;
          if (!matchName && !matchDesc && !matchLoc && !matchCat) return false;
        }

        // Category filter
        if (selectedCategory !== 'all') {
          if (service.categoryId !== selectedCategory) return false;
        }

        // Status filter
        if (statusFilter === 'active' && !service.isActive) return false;
        if (statusFilter === 'inactive' && service.isActive) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'price-asc') {
          return a.price - b.price;
        }
        if (sortBy === 'price-desc') {
          return b.price - a.price;
        }
        if (sortBy === 'capacity') {
          return b.capacity - a.capacity;
        }
        return 0;
      });
  }, [services, searchQuery, selectedCategory, statusFilter, sortBy]);

  // Handle direct toggle or trigger deactivation dialog
  const handleRequestToggle = (service: ProviderServiceListItem) => {
    if (service.isActive) {
      // Opening confirmation dialog for deactivating active service
      setServiceToToggle(service);
    } else {
      // Direct activation
      handleConfirmToggle(service.id);
    }
  };

  const handleConfirmToggle = async (serviceId: string) => {
    const res = await toggleServiceStatus(serviceId);
    if (!res.success) {
      toast.error(res.error || 'Failed to update service status');
      return;
    }

    setServices((prev) =>
      prev.map((s) =>
        s.id === serviceId ? { ...s, isActive: res.data?.isActive ?? !s.isActive } : s
      )
    );

    toast.success(
      res.data?.isActive ? 'Service activated and listed on catalog' : 'Service deactivated and hidden from students'
    );
  };

  const handleConfirmDelete = async (serviceId: string) => {
    const res = await deleteService(serviceId);
    if (!res.success) {
      toast.error(res.error || 'Failed to delete service');
      return;
    }

    setServices((prev) => prev.filter((s) => s.id !== serviceId));
    toast.success('Service deleted successfully');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setStatusFilter('all');
    setSortBy('newest');
  };

  return (
    <div className="space-y-8">
      {/* 1. Header Banner & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="glow" className="text-[11px] gap-1 px-2.5">
              <Wrench className="h-3 w-3 text-indigo-400" />
              <span>Provider Management</span>
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            My Services
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
            Configure, publish, and maintain campus service offerings, pricing, capacities, and locations.
          </p>
        </div>

        <Link href="/provider/services/new">
          <Button variant="gradient" size="sm" className="text-xs gap-1.5 shadow-md shadow-indigo-500/20">
            <Plus className="h-4 w-4" />
            <span>Add New Service</span>
          </Button>
        </Link>
      </div>

      {/* 2. Quick Metrics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-card/70 backdrop-blur-sm border-border/70">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-semibold">Total Services</CardDescription>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-foreground pt-1">
              {totalServices}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            Configured portfolio
          </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur-sm border-border/70">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-semibold">Active Services</CardDescription>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-emerald-600 dark:text-emerald-400 pt-1">
              {activeCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            Accepting bookings
          </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur-sm border-border/70">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-semibold">Inactive Services</CardDescription>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Power className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-amber-600 dark:text-amber-400 pt-1">
              {inactiveCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            Paused / hidden
          </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur-sm border-border/70">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-semibold">Total Bookings</CardDescription>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-purple-600 dark:text-purple-400 pt-1">
              {totalBookingsCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            All-time student orders
          </CardContent>
        </Card>
      </div>

      {/* 3. Search, Filter, Sort and View-Toggle Toolbar */}
      {totalServices > 0 && (
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between rounded-2xl border border-border/70 bg-card/60 p-3.5 backdrop-blur-sm">
          {/* Search box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by service name, description, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs bg-background/50 h-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[160px] text-xs h-9 bg-background/50">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  All Categories
                </SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} className="text-xs">
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <div className="flex rounded-lg border border-border/70 p-0.5 bg-background/50">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  statusFilter === 'active'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('inactive')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  statusFilter === 'inactive'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Inactive
              </button>
            </div>

            {/* Sort Dropdown */}
            <Select
              value={sortBy}
              onValueChange={(v) =>
                setSortBy(v as 'newest' | 'price-asc' | 'price-desc' | 'capacity')
              }
            >
              <SelectTrigger className="w-[140px] text-xs h-9 bg-background/50">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest" className="text-xs">
                  Newest First
                </SelectItem>
                <SelectItem value="price-asc" className="text-xs">
                  Price: Low to High
                </SelectItem>
                <SelectItem value="price-desc" className="text-xs">
                  Price: High to Low
                </SelectItem>
                <SelectItem value="capacity" className="text-xs">
                  Highest Capacity
                </SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Switcher */}
            <div className="flex rounded-lg border border-border/70 p-0.5 bg-background/50">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Table View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Display Content: Zero state, Filtered empty state, Grid View, or Table View */}
      {totalServices === 0 ? (
        <ServiceEmptyState type="no-services" />
      ) : filteredServices.length === 0 ? (
        <ServiceEmptyState
          type="no-results"
          onResetFilters={handleResetFilters}
          searchQuery={searchQuery}
        />
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((service) => (
            <Card
              key={service.id}
              className="group flex flex-col overflow-hidden border-border/70 bg-card/70 backdrop-blur-sm transition-all hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/5"
            >
              {/* Service Image / Header Banner */}
              <div className="relative h-44 w-full overflow-hidden bg-muted">
                {service.imageUrl ? (
                  <Image
                    src={service.imageUrl}
                    alt={service.name}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-indigo-950/40 to-muted text-indigo-400">
                    <CategoryIcon name={service.categoryIcon} className="h-12 w-12 stroke-[1.5]" />
                  </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Badges on Image */}
                <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
                  <Badge
                    variant={service.isActive ? 'glow' : 'outline'}
                    className={`text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md ${
                      service.isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-black/60 text-muted-foreground border-white/10'
                    }`}
                  >
                    {service.isActive ? '● Active' : '○ Inactive'}
                  </Badge>
                </div>

                <div className="absolute right-3 top-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 rounded-full bg-black/40 p-0 text-white backdrop-blur-md hover:bg-black/60"
                      >
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Service actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 text-xs">
                      <Link href={`/provider/services/${service.id}`}>
                        <DropdownMenuItem className="gap-2 cursor-pointer">
                          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>View Details</span>
                        </DropdownMenuItem>
                      </Link>
                      <Link href={`/provider/services/${service.id}/edit`}>
                        <DropdownMenuItem className="gap-2 cursor-pointer">
                          <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Edit Service</span>
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem
                        onClick={() => handleRequestToggle(service)}
                        className="gap-2 cursor-pointer"
                      >
                        <Power className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{service.isActive ? 'Deactivate' : 'Activate'}</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setServiceToDelete(service)}
                        className="gap-2 text-rose-500 hover:text-rose-600 focus:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete Service</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Category Pill on Image Bottom */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md bg-black/50 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-md">
                  <CategoryIcon name={service.categoryIcon} className="h-3 w-3 text-indigo-400" />
                  <span>{service.categoryName}</span>
                </div>
              </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col p-4 space-y-3">
                  <div>
                    <Link
                      href={`/provider/services/${service.id}`}
                      className="text-base font-bold text-foreground hover:text-indigo-500 transition-colors line-clamp-1"
                    >
                      {service.name}
                    </Link>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {service.description || 'No description provided for this campus service.'}
                    </p>
                  </div>

                  {/* Location badge */}
                  {service.location && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-purple-500" />
                      <span className="truncate">{service.location}</span>
                    </div>
                  )}

                  {/* Pricing, Duration & Capacity Specs */}
                  <div className="grid grid-cols-3 gap-2 rounded-xl border border-border/50 bg-muted/20 p-2.5 text-center mt-auto">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Price</span>
                      <p className="text-xs font-black text-foreground">
                        {service.price > 0 ? `₹${service.price}` : 'Free'}
                      </p>
                    </div>
                    <div className="border-x border-border/50">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Duration</span>
                      <p className="text-xs font-black text-foreground">
                        {service.durationMinutes}m
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Capacity</span>
                      <p className="text-xs font-black text-foreground">
                        {service.capacity}
                      </p>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="text-[11px] text-muted-foreground">
                      <strong>{service.totalBookings}</strong> orders
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Link href={`/provider/services/${service.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs px-2.5">
                          Details
                        </Button>
                      </Link>
                      <Link href={`/provider/services/${service.id}/edit`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs px-2.5 gap-1">
                          <Edit2 className="h-3 w-3" />
                          <span>Edit</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
      ) : (
        /* TABLE VIEW */
        <Card className="border-border/70 bg-card/70 backdrop-blur-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="w-[300px]">Service</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bookings</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.map((service) => (
                <TableRow key={service.id} className="border-border/50 hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {service.imageUrl ? (
                          <Image
                            src={service.imageUrl}
                            alt={service.name}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-indigo-400">
                            <CategoryIcon name={service.categoryIcon} className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/provider/services/${service.id}`}
                          className="font-bold text-xs text-foreground hover:text-indigo-500 truncate block"
                        >
                          {service.name}
                        </Link>
                        <span className="text-[10px] text-muted-foreground truncate block">
                          {service.description || 'No description'}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-foreground">
                      <CategoryIcon name={service.categoryIcon} className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                      <span>{service.categoryName}</span>
                    </div>
                  </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-foreground">
                      {service.price > 0 ? `₹${service.price}` : 'Free'}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {service.durationMinutes} mins
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {service.capacity} slot{service.capacity > 1 ? 's' : ''}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                      {service.location || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={service.isActive ? 'glow' : 'outline'}
                        className="text-[10px] uppercase font-bold"
                      >
                        {service.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {service.totalBookings}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/provider/services/${service.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Link href={`/provider/services/${service.id}/edit`}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRequestToggle(service)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          title={service.isActive ? 'Deactivate' : 'Activate'}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setServiceToDelete(service)}
                          className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                          title="Delete service"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Confirmation Dialogs */}
      <ServiceDeleteDialog
        open={!!serviceToDelete}
        onOpenChange={(open) => !open && setServiceToDelete(null)}
        service={serviceToDelete}
        onConfirmDelete={handleConfirmDelete}
        onDeactivateInstead={async (serviceId) => {
          await handleConfirmToggle(serviceId);
        }}
      />

      <ServiceStatusDialog
        open={!!serviceToToggle}
        onOpenChange={(open) => !open && setServiceToToggle(null)}
        service={serviceToToggle}
        onConfirmToggle={handleConfirmToggle}
      />
    </div>
  );
}
