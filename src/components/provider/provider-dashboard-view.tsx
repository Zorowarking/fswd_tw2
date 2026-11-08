'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Wrench,
  Clock,
  TrendingUp,
  Inbox,
  CheckCircle,
  Banknote,
  Star,
  Plus,
  ShieldCheck,
  Check,
  X,
  ArrowRight,
  Layers,
  CalendarCheck,
} from 'lucide-react';
import { PortalShell } from '@/components/layout/portal-shell';
import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type {
  ProviderDashboardData,
  ProviderServiceItem,
  ProviderBookingRequest,
} from '@/lib/provider-dashboard-data';
import { CAMPUS_SERVICE_CATEGORIES } from '@/lib/constants';
import { useUser } from '@clerk/nextjs';

interface ProviderDashboardViewProps {
  initialData: ProviderDashboardData;
}

export function ProviderDashboardView({ initialData }: ProviderDashboardViewProps) {
  const { user } = initialData;
  const { user: clerkUser } = useUser();

  const displayName =
    clerkUser?.fullName ||
    clerkUser?.firstName ||
    (user.name && !user.name.startsWith('user_') ? user.name : 'Campus Service Provider');

  const displayEmail =
    clerkUser?.primaryEmailAddress?.emailAddress ||
    (user.email && !user.email.startsWith('user_') ? user.email : 'provider@campus.edu');

  // Local state for interactive services and requests
  const [services, setServices] = React.useState<ProviderServiceItem[]>(initialData.services);
  const [recentRequests, setRecentRequests] = React.useState<ProviderBookingRequest[]>(
    initialData.recentRequests
  );
  const [schedule] = React.useState(initialData.todaySchedule);
  const [addServiceDialogOpen, setAddServiceDialogOpen] = React.useState(false);
  const [verifyTokenDialogOpen, setVerifyTokenDialogOpen] = React.useState(false);
  const [tokenInput, setTokenInput] = React.useState('');
  const [tokenVerificationResult, setTokenVerificationResult] = React.useState<string | null>(null);

  // New Service Form State
  const [newServiceName, setNewServiceName] = React.useState('');
  const [newServiceCategory, setNewServiceCategory] = React.useState(
    CAMPUS_SERVICE_CATEGORIES[0]?.name || 'Hostel Laundry Services'
  );
  const [newServicePrice, setNewServicePrice] = React.useState('75');
  const [newServiceDuration, setNewServiceDuration] = React.useState('45');

  // Dynamically computed metrics
  const totalServices = services.length;
  const activeServices = services.filter((s) => s.isActive).length;
  const pendingRequests = recentRequests.filter((r) => r.status === 'PENDING').length;
  const confirmedBookings = recentRequests.filter((r) => r.status === 'CONFIRMED').length;
  const completedBookings = recentRequests.filter((r) => r.status === 'COMPLETED').length;
  const revenue = recentRequests
    .filter((r) => r.status === 'COMPLETED')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Handler to toggle service active state
  const handleToggleServiceStatus = (serviceId: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, isActive: !s.isActive } : s))
    );
  };

  // Handler to accept a booking request
  const handleAcceptRequest = (requestId: string) => {
    setRecentRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'CONFIRMED' } : r))
    );
  };

  // Handler to decline a booking request
  const handleDeclineRequest = (requestId: string) => {
    setRecentRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'CANCELLED' } : r))
    );
  };

  // Handler to add a new service
  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    const newService: ProviderServiceItem = {
      id: `srv-${Date.now()}`,
      name: newServiceName.trim(),
      category: newServiceCategory,
      price: parseFloat(newServicePrice) || 50,
      durationMinutes: parseInt(newServiceDuration, 10) || 30,
      isActive: true,
      totalBookings: 0,
    };

    setServices((prev) => [newService, ...prev]);
    setNewServiceName('');
    setAddServiceDialogOpen(false);
  };

  // Handler to verify a token
  const handleVerifyToken = () => {
    if (!tokenInput.trim()) return;
    setTokenVerificationResult(`Token [${tokenInput.trim().toUpperCase()}] verified successfully. Order marked fulfilled.`);
    setTimeout(() => {
      setTokenInput('');
      setVerifyTokenDialogOpen(false);
      setTokenVerificationResult(null);
    }, 1800);
  };

  return (
    <PortalShell
      area="provider"
      breadcrumbs={[{ label: 'Operations Desk', active: true }]}
    >
      <PageContainer
        title="Service Provider Operations Desk"
        description="Fulfill student requests, manage availability, publish amenities, and audit campus revenue."
        badge={
          <StatusIndicator status="online" label="Dispatch Ready • Live" size="sm" />
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVerifyTokenDialogOpen(true)}
              className="gap-1.5 text-xs"
            >
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              <span>Verify Token</span>
            </Button>
            <Link href="/provider/services/new">
              <Button
                variant="gradient"
                size="sm"
                className="gap-1.5 text-xs shadow-md shadow-indigo-500/20"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Service</span>
              </Button>
            </Link>
          </div>
        }
      >
        <div className="space-y-8">
          {/* 1. Welcome Section & Provider Profile Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-600/10 via-purple-600/5 to-card p-6 sm:p-8 backdrop-blur-xl shadow-lg shadow-indigo-500/5">
            <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="glow" className="gap-1 px-2.5 py-0.5 text-[11px]">
                    <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Verified University Service Provider</span>
                  </Badge>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    Provider active since {user.formattedJoinedDate}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  {displayName} Operations Desk
                </h1>

                <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                  Manage assigned campus service queues, publish operational time blocks, accept work orders,
                  and audit automated Razorpay settlements with verified student identity assurance.
                </p>
              </div>

              {/* Provider Status Pill */}
              <div className="flex items-center gap-3.5 rounded-2xl border border-border/70 bg-card/70 p-3.5 backdrop-blur-sm sm:min-w-[280px]">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-base shadow-md shadow-indigo-500/20">
                  <Wrench className="h-5 w-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-foreground truncate">{displayName}</span>
                  <span className="text-[11px] text-muted-foreground truncate">{displayEmail}</span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                    ● Role Active: SERVICE_PROVIDER
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. The 6 Core Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* Metric 1: Total Services */}
            <Card className="bg-card/70 backdrop-blur-sm border-border/70 hover:border-indigo-500/40 transition-all">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-semibold">Total Services</CardDescription>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Layers className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-black text-foreground pt-1">
                  {totalServices}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
                Catalog offerings
              </CardContent>
            </Card>

            {/* Metric 2: Active Services */}
            <Card className="bg-card/70 backdrop-blur-sm border-border/70 hover:border-emerald-500/40 transition-all">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-semibold">Active Services</CardDescription>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 pt-1">
                  {activeServices}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
                Accepting bookings
              </CardContent>
            </Card>

            {/* Metric 3: Pending Booking Requests */}
            <Card className="bg-card/70 backdrop-blur-sm border-border/70 hover:border-amber-500/40 transition-all">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-semibold">Pending Requests</CardDescription>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Inbox className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 pt-1">
                  {pendingRequests}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
                Action required
              </CardContent>
            </Card>

            {/* Metric 4: Confirmed Bookings */}
            <Card className="bg-card/70 backdrop-blur-sm border-border/70 hover:border-blue-500/40 transition-all">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-semibold">Confirmed</CardDescription>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <CalendarCheck className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 pt-1">
                  {confirmedBookings}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
                Ready for dispatch
              </CardContent>
            </Card>

            {/* Metric 5: Completed Bookings */}
            <Card className="bg-card/70 backdrop-blur-sm border-border/70 hover:border-purple-500/40 transition-all">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-semibold">Completed</CardDescription>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-black text-foreground pt-1">
                  {completedBookings}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
                Fulfilled orders
              </CardContent>
            </Card>

            {/* Metric 6: Revenue */}
            <Card className="bg-card/70 backdrop-blur-sm border-border/70 hover:border-emerald-500/40 transition-all">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-semibold">Revenue</CardDescription>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Banknote className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 pt-1">
                  ₹{revenue}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
                Settled turnover
              </CardContent>
            </Card>
          </div>

          {/* 3. Main Dashboard Grid (2 Columns: Operations on Left, Services & Reviews on Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Columns: Today's Schedule & Recent Booking Requests */}
            <div className="lg:col-span-2 space-y-8">
              {/* Today's Schedule Section */}
              <div id="availability" className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                      <Clock className="h-5 w-5 text-indigo-500" />
                      <span>Today&apos;s Operational Schedule</span>
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Active operational windows, shift capacity, and fulfillment slots
                    </p>
                  </div>
                  <Badge variant="glow" className="text-xs">
                    Campus Schedule Active
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {schedule.map((slot) => (
                    <Card
                      key={slot.id}
                      className="bg-card/70 backdrop-blur-sm border-border/80 hover:border-indigo-500/40 transition-all p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">{slot.period}</span>
                        <Badge
                          variant={slot.status === 'PEAK' ? 'warning' : 'success'}
                          className="text-[10px]"
                        >
                          {slot.status}
                        </Badge>
                      </div>

                      <div>
                        <span className="text-lg font-extrabold text-foreground font-mono">
                          {slot.timeWindow}
                        </span>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {slot.activeService}
                        </p>
                      </div>

                      <div className="space-y-1.5 border-t border-border/60 pt-2.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">Slot Utilization</span>
                          <span className="font-semibold text-foreground">
                            {slot.bookedCount} / {slot.capacity}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 transition-all duration-500"
                            style={{
                              width: `${Math.min(100, (slot.bookedCount / slot.capacity) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Recent Booking Requests Table */}
              <div id="requests" className="space-y-4 pt-4 border-t border-border/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                      <Inbox className="h-5 w-5 text-amber-500" />
                      <span>Recent Booking Requests</span>
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Student work orders awaiting provider confirmation, fulfillment, and token verification
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {pendingRequests} Pending Review
                  </Badge>
                </div>

                {recentRequests.length > 0 ? (
                  <Card className="bg-card/70 backdrop-blur-sm border-border/80 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Requested Time</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentRequests.map((req) => (
                          <TableRow key={req.id}>
                            <TableCell className="font-mono text-xs font-bold text-primary">
                              {req.requestCode}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold text-foreground">
                                  {req.studentName}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {req.studentEmail}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs font-medium">{req.serviceName}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {req.scheduledTime}
                            </TableCell>
                            <TableCell className="text-xs font-semibold text-foreground">
                              ₹{req.amount}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  req.status === 'PENDING'
                                    ? 'warning'
                                    : req.status === 'CONFIRMED'
                                    ? 'info'
                                    : 'success'
                                }
                                className="text-[10px]"
                              >
                                {req.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {req.status === 'PENDING' ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAcceptRequest(req.id)}
                                    className="h-7 px-2 text-[11px] gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                                  >
                                    <Check className="h-3 w-3" />
                                    <span>Accept</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeclineRequest(req.id)}
                                    className="h-7 px-2 text-[11px] gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
                                  >
                                    <X className="h-3 w-3" />
                                    <span>Decline</span>
                                  </Button>
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-[10px]">
                                  {req.status}
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 p-8 text-center space-y-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
                      <Inbox className="h-6 w-6" />
                    </div>
                    <div className="space-y-1 max-w-md">
                      <h3 className="text-sm font-bold text-foreground">No Pending Booking Requests</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        You are completely caught up! New student bookings for your published amenities will stream
                        into this desk automatically.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddServiceDialogOpen(true)}
                      className="mt-2 text-xs font-semibold gap-1.5"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add Another Service</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Services Portfolio & Recent Reviews */}
            <div className="space-y-6">
              {/* My Services List */}
              <div id="services" className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-indigo-500" />
                    <span>My Published Services</span>
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <Link href="/provider/services">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] gap-1">
                        <span>View All</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                    <Link href="/provider/services/new">
                      <Button variant="outline" size="sm" className="h-7 px-2 text-[11px] gap-1">
                        <Plus className="h-3 w-3" />
                        <span>New</span>
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="space-y-3">
                  {services.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 p-6 text-center space-y-2">
                      <p className="text-xs font-semibold text-foreground">No services created yet</p>
                      <p className="text-[11px] text-muted-foreground">
                        List your facilities or equipment to begin accepting student orders.
                      </p>
                      <Link href="/provider/services/new" className="pt-1">
                        <Button variant="gradient" size="sm" className="h-7 text-xs gap-1">
                          <Plus className="h-3 w-3" />
                          <span>Add First Service</span>
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    services.map((service) => (
                      <Card
                        key={service.id}
                        className="bg-card/70 backdrop-blur-sm border-border/80 p-4 space-y-2.5 hover:border-indigo-500/40 transition-all group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link
                              href={`/provider/services/${service.id}`}
                              className="text-xs font-bold text-foreground leading-snug group-hover:text-indigo-500 transition-colors block"
                            >
                              {service.name}
                            </Link>
                            <span className="text-[10px] text-muted-foreground">
                              {service.category}
                            </span>
                          </div>
                          <Badge
                            variant={service.isActive ? 'success' : 'secondary'}
                            className="text-[10px] cursor-pointer"
                            onClick={() => handleToggleServiceStatus(service.id)}
                            title="Click to toggle status"
                          >
                            {service.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between border-t border-border/60 pt-2 text-xs">
                          <span className="font-bold text-foreground">₹{service.price}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {service.durationMinutes} mins
                            </span>
                            <Link
                              href={`/provider/services/${service.id}`}
                              className="text-[11px] text-indigo-500 hover:underline font-medium"
                            >
                              Manage →
                            </Link>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Reviews Section */}
              <div id="reviews" className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span>Recent Reviews</span>
                  </h3>
                  <Badge variant="glow" className="text-[10px]">
                    Student Ratings
                  </Badge>
                </div>

                {initialData.recentReviews.length > 0 ? (
                  <div className="space-y-3">
                    {initialData.recentReviews.map((review) => (
                      <Card
                        key={review.id}
                        className="bg-card/70 backdrop-blur-sm border-border/80 p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground">
                            {review.studentName}
                          </span>
                          <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                            <Star className="h-3 w-3 fill-amber-500" />
                            <span>{review.rating}.0</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground italic leading-relaxed">
                          &ldquo;{review.comment}&rdquo;
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/60 pt-1.5">
                          <span>{review.serviceName}</span>
                          <span>{review.date}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="bg-card/70 backdrop-blur-sm border-border/80 p-6 text-center space-y-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 mx-auto">
                      <Star className="h-5 w-5" />
                    </div>
                    <h4 className="text-xs font-bold text-foreground">No Reviews Submitted Yet</h4>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      Student ratings and service feedback will appear here as orders are fulfilled and token slips
                      closed.
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </PageContainer>

      {/* Dialog: Add Service */}
      <Dialog open={addServiceDialogOpen} onOpenChange={setAddServiceDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-indigo-500" />
              <span>Add New Service Offering</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Publish a new amenity for student discovery and slot reservation
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateService} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Service Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Express Machine Wash & Dry"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                className="w-full h-9 rounded-xl border border-border bg-card px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Service Category</label>
              <select
                value={newServiceCategory}
                onChange={(e) => setNewServiceCategory(e.target.value)}
                className="w-full h-9 rounded-xl border border-border bg-card px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {CAMPUS_SERVICE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  required
                  value={newServicePrice}
                  onChange={(e) => setNewServicePrice(e.target.value)}
                  className="w-full h-9 rounded-xl border border-border bg-card px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Slot Duration (Mins)</label>
                <input
                  type="number"
                  min="15"
                  step="15"
                  required
                  value={newServiceDuration}
                  onChange={(e) => setNewServiceDuration(e.target.value)}
                  className="w-full h-9 rounded-xl border border-border bg-card px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <DialogFooter className="flex sm:justify-between gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddServiceDialogOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" variant="gradient" size="sm" className="text-xs gap-1.5">
                <span>Publish Service</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Verify Token */}
      <Dialog open={verifyTokenDialogOpen} onOpenChange={setVerifyTokenDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <span>Verify Student Token Slip</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Confirm student collection token before service delivery
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Token Code</label>
              <input
                type="text"
                placeholder="e.g. CS-2026-X8B2"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full h-10 uppercase tracking-widest font-mono font-bold rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {tokenVerificationResult && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {tokenVerificationResult}
              </div>
            )}
          </div>

          <DialogFooter className="flex sm:justify-between gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setVerifyTokenDialogOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleVerifyToken}
              disabled={!tokenInput.trim()}
              className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Verify & Complete</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalShell>
  );
}
