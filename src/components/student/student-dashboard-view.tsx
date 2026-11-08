'use client';

import * as React from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import {
  CalendarClock,
  Activity,
  CheckCircle2,
  XCircle,
  Layers,
  Plus,
  Compass,
  Sparkles,
  Shirt,
  UtensilsCrossed,
  Laptop,
  Building2,
  Wrench,
  Printer,
  ShieldCheck,
  CreditCard,
  MessageSquare,
  ArrowRight,
  LifeBuoy,
  PhoneCall,
  Search,
} from 'lucide-react';
import { PortalShell } from '@/components/layout/portal-shell';
import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { StudentDashboardData, BookingItem } from '@/lib/student-dashboard-data';
import { APP_CONFIG } from '@/lib/constants';

interface StudentDashboardViewProps {
  initialData: StudentDashboardData;
}

// Icon mapping for service categories
const serviceIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Shirt,
  UtensilsCrossed,
  Laptop,
  Building2,
  Wrench,
  Printer,
};

export function StudentDashboardView({ initialData }: StudentDashboardViewProps) {
  const { user, metrics, bookings, recentActivity, recommendedServices } = initialData;
  const { user: clerkUser } = useUser();

  // Resolve user display name: prioritize Clerk real name, fallback to clean campus name
  const displayName =
    clerkUser?.fullName ||
    clerkUser?.firstName ||
    (user.name && !user.name.startsWith('user_') ? user.name : 'Campus Student');

  // Resolve user display email: prioritize Clerk email, sanitize generated internal IDs
  const displayEmail =
    clerkUser?.primaryEmailAddress?.emailAddress ||
    (user.email && !user.email.startsWith('user_') ? user.email : 'student@campus.edu');

  const [selectedService, setSelectedService] = React.useState<string | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredServices = recommendedServices.filter((service) =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PortalShell
      area="student"
      breadcrumbs={[{ label: 'Dashboard Overview', active: true }]}
    >
      <PageContainer
        title={`Welcome back, ${displayName}`}
        description="Unified hub for campus service discovery, slot reservations, real-time tracking, and automated receipts."
        badge={
          <StatusIndicator status="online" label="Campus Services Active" size="sm" />
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/student/services">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Compass className="h-3.5 w-3.5 text-blue-500" />
                <span>Browse Services</span>
              </Button>
            </Link>
            <Button
              variant="gradient"
              size="sm"
              onClick={() => {
                setSelectedService('General Campus Booking');
                setBookingDialogOpen(true);
              }}
              className="gap-1.5 text-xs shadow-md shadow-blue-500/20"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Booking</span>
            </Button>
          </div>
        }
      >
        <div className="space-y-8">
          {/* 1. Welcome Section & Identity Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-card p-6 sm:p-8 backdrop-blur-xl shadow-lg shadow-blue-500/5">
            <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="info" className="gap-1 px-2.5 py-0.5 text-[11px]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Verified Student Account</span>
                  </Badge>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    Member since {user.formattedJoinedDate}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  Smart Campus Digital Life
                </h1>

                <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                  Book laundry washing cycles, reserve mess meals, schedule high-performance IT lab
                  passes, and submit repair tickets with instant Razorpay test verification.
                </p>
              </div>

              {/* Student Quick Bio & Email Card */}
              <div className="flex items-center gap-3.5 rounded-2xl border border-border/70 bg-card/70 p-3.5 backdrop-blur-sm sm:min-w-[280px]">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-base shadow-md shadow-blue-500/20">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-foreground truncate">{displayName}</span>
                  <span className="text-[11px] text-muted-foreground truncate">{displayEmail}</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                    ● Role Active: STUDENT
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. The 5 Core Booking Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Metric 1: Upcoming Bookings */}
            <Card className="bg-card/70 backdrop-blur-sm border-border/70 hover:border-blue-500/40 transition-all">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-semibold">Upcoming</CardDescription>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <CalendarClock className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-black text-foreground pt-1">
                  {metrics.upcomingCount}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
                {metrics.upcomingCount > 0 ? 'Scheduled slots' : 'No upcoming slots'}
              </CardContent>
            </Card>

            {/* Metric 2: Active Bookings */}
            <Card className="bg-card/70 backdrop-blur-sm border-border/70 hover:border-emerald-500/40 transition-all">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-semibold">Active Orders</CardDescription>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Activity className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-black text-foreground pt-1">
                  {metrics.activeCount}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
                {metrics.activeCount > 0 ? 'Fulfillment in progress' : '0 orders underway'}
              </CardContent>
            </Card>

            {/* Metric 3: Completed Bookings */}
            <Card className="bg-card/70 backdrop-blur-sm border-border/70 hover:border-sky-500/40 transition-all">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-semibold">Completed</CardDescription>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-black text-foreground pt-1">
                  {metrics.completedCount}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
                {metrics.completedCount > 0 ? 'Fulfilled history' : '0 completed yet'}
              </CardContent>
            </Card>

            {/* Metric 4: Cancelled Bookings */}
            <Card className="bg-card/70 backdrop-blur-sm border-border/70 hover:border-rose-500/40 transition-all">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-semibold">Cancelled</CardDescription>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    <XCircle className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-black text-foreground pt-1">
                  {metrics.cancelledCount}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
                {metrics.cancelledCount > 0 ? 'Voided requests' : '0 cancellations'}
              </CardContent>
            </Card>

            {/* Metric 5: Total Bookings */}
            <Card className="bg-card/70 backdrop-blur-sm border-border/70 hover:border-purple-500/40 transition-all col-span-2 sm:col-span-1">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-semibold">Total History</CardDescription>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Layers className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-black text-foreground pt-1">
                  {metrics.totalCount}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
                All-time service orders
              </CardContent>
            </Card>
          </div>

          {/* 3. Main Dashboard Layout: 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Columns: Bookings Management & Recommended Services */}
            <div className="lg:col-span-2 space-y-8">
              {/* Bookings Section with Tabs */}
              <div id="bookings" className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">
                      My Campus Bookings
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Track slot reservations, live token status, and order dispatch
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedService('Quick Campus Slot');
                      setBookingDialogOpen(true);
                    }}
                    className="gap-1 text-xs"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Reserve New Slot</span>
                  </Button>
                </div>

                <Tabs defaultValue="upcoming" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 h-10">
                    <TabsTrigger value="upcoming" className="text-xs">
                      Upcoming ({metrics.upcomingCount})
                    </TabsTrigger>
                    <TabsTrigger value="active" className="text-xs">
                      Active ({metrics.activeCount})
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="text-xs">
                      Completed ({metrics.completedCount})
                    </TabsTrigger>
                    <TabsTrigger value="cancelled" className="text-xs">
                      Cancelled ({metrics.cancelledCount})
                    </TabsTrigger>
                  </TabsList>

                  {/* Upcoming Bookings Tab */}
                  <TabsContent value="upcoming" className="pt-4 space-y-4">
                    {bookings.upcoming.length > 0 ? (
                      <div className="space-y-3">
                        {bookings.upcoming.map((item) => (
                          <BookingCard key={item.id} item={item} />
                        ))}
                      </div>
                    ) : (
                      <EmptyBookingState
                        icon={CalendarClock}
                        title="No Upcoming Bookings"
                        description="You do not have any future campus slots reserved. Browse the services catalog to reserve hostel laundry, meals, or rooms."
                        actionLabel="Browse Campus Services"
                        onAction={() => {
                          const el = document.getElementById('services');
                          el?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      />
                    )}
                  </TabsContent>

                  {/* Active Bookings Tab */}
                  <TabsContent value="active" className="pt-4 space-y-4">
                    {bookings.active.length > 0 ? (
                      <div className="space-y-3">
                        {bookings.active.map((item) => (
                          <BookingCard key={item.id} item={item} />
                        ))}
                      </div>
                    ) : (
                      <EmptyBookingState
                        icon={Activity}
                        title="No Active Work Orders"
                        description="No campus services are currently in progress. When a provider begins fulfillment, real-time token tracking appears here."
                        actionLabel="Reserve a Slot"
                        onAction={() => {
                          setSelectedService('Hostel Laundry Machine');
                          setBookingDialogOpen(true);
                        }}
                      />
                    )}
                  </TabsContent>

                  {/* Completed Bookings Tab */}
                  <TabsContent value="completed" className="pt-4 space-y-4">
                    {bookings.completed.length > 0 ? (
                      <div className="space-y-3">
                        {bookings.completed.map((item) => (
                          <BookingCard key={item.id} item={item} />
                        ))}
                      </div>
                    ) : (
                      <EmptyBookingState
                        icon={CheckCircle2}
                        title="No Completed Bookings Yet"
                        description="Your completed service orders, payment receipts, and token collection histories will be logged here permanently."
                        actionLabel="Explore Services"
                        onAction={() => {
                          const el = document.getElementById('services');
                          el?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      />
                    )}
                  </TabsContent>

                  {/* Cancelled Bookings Tab */}
                  <TabsContent value="cancelled" className="pt-4 space-y-4">
                    {bookings.cancelled.length > 0 ? (
                      <div className="space-y-3">
                        {bookings.cancelled.map((item) => (
                          <BookingCard key={item.id} item={item} />
                        ))}
                      </div>
                    ) : (
                      <EmptyBookingState
                        icon={XCircle}
                        title="No Cancelled Bookings"
                        description="You have zero cancelled or refunded orders. All scheduled campus services remain in good standing."
                        actionLabel="View Active Catalog"
                        onAction={() => {
                          const el = document.getElementById('services');
                          el?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      />
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              {/* Recommended & Popular Services Grid */}
              <div id="services" className="space-y-4 pt-4 border-t border-border/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                      <span>Recommended & Popular Services</span>
                      <Badge variant="glow" className="text-[10px] px-2 py-0">
                        Popular
                      </Badge>
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      High-demand amenities available for instantaneous scheduling and digital token generation
                    </p>
                  </div>

                  {/* Live filter input & Browse link */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-56">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Filter amenities..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-8 pl-8 pr-3 text-xs rounded-xl border border-border bg-card/60 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <Link href="/student/services">
                      <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-blue-500 hover:text-blue-600">
                        <span>Directory</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredServices.map((service) => {
                    const IconComponent = serviceIconMap[service.icon] || Sparkles;

                    return (
                      <Card
                        key={service.id}
                        className="group relative overflow-hidden bg-card/60 backdrop-blur-sm border-border/80 hover:border-primary/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col justify-between"
                      >
                        <CardHeader className="p-5 pb-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground shadow-sm">
                              <IconComponent className="h-5 w-5" />
                            </div>
                            {service.badge && (
                              <Badge
                                variant={service.popular ? 'glow' : 'outline'}
                                className="text-[10px]"
                              >
                                {service.badge}
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-base font-bold text-foreground pt-3">
                            {service.name}
                          </CardTitle>
                          <CardDescription className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {service.description}
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="p-5 pt-0">
                          <div className="flex items-center justify-between border-t border-border/60 pt-3">
                            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                              <CreditCard className="h-3 w-3 text-emerald-500" />
                              <span>Razorpay Supported</span>
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedService(service.name);
                                setBookingDialogOpen(true);
                              }}
                              className="text-xs gap-1.5 group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                            >
                              <span>Book Slot</span>
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Quick Action Buttons, Activity Timeline, Support */}
            <div className="space-y-6">
              {/* Quick Action Buttons Panel */}
              <Card className="bg-card/70 backdrop-blur-xl border-border/80 shadow-md">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    <span>Quick Action Desk</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Frequent student shortcuts & operations
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-between text-xs h-9"
                    onClick={() => {
                      setSelectedService('Hostel Laundry Washing Machine #3');
                      setBookingDialogOpen(true);
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <Shirt className="h-3.5 w-3.5 text-blue-500" />
                      <span>Book Laundry Slot</span>
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-between text-xs h-9"
                    onClick={() => {
                      setSelectedService('Mess Dinner Special Token');
                      setBookingDialogOpen(true);
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <UtensilsCrossed className="h-3.5 w-3.5 text-amber-500" />
                      <span>Pre-order Mess Meal</span>
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-between text-xs h-9"
                    onClick={() => {
                      setSelectedService('IT Hardware Wi-Fi Pass');
                      setBookingDialogOpen(true);
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <Laptop className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Request IT Support</span>
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-between text-xs h-9"
                    onClick={() => {
                      setSelectedService('Library Discussion Pod');
                      setBookingDialogOpen(true);
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Reserve Study Room</span>
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </Button>

                  <a href="#feedback" className="block pt-1">
                    <Button variant="ghost" className="w-full justify-center text-xs h-8 gap-1.5 text-muted-foreground hover:text-foreground">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Submit Service Feedback</span>
                    </Button>
                  </a>
                </CardContent>
              </Card>

              {/* Recent Activity Section */}
              <Card className="bg-card/70 backdrop-blur-xl border-border/80 shadow-md">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-foreground">
                      Recent Activity
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px]">
                      Live Audit
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Real events recorded for your campus identity
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-3">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/30 p-3"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                        <Activity className="h-3.5 w-3.5" />
                      </div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-semibold text-foreground truncate">
                            {activity.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {activity.timestamp}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-normal">
                          {activity.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Campus Support & Feedback Banner */}
              <div id="feedback" className="rounded-2xl border border-border/80 bg-gradient-to-br from-blue-500/5 via-card/70 to-card p-5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                    <LifeBuoy className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Campus Helpdesk & Feedback</h3>
                    <p className="text-[11px] text-muted-foreground">24/7 student service assistance</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border/60 pt-2.5">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="h-3 w-3 text-emerald-500" />
                    <span>Emergency Desk: {APP_CONFIG.emergencyDesk}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-3 w-3 text-blue-500" />
                    <span>Location: {APP_CONFIG.campusLocation}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>

      {/* Booking Modal / Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Reserve Campus Slot
            </DialogTitle>
            <DialogDescription className="text-xs">
              {selectedService ? `Service: ${selectedService}` : 'Select your slot preferences'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-2">
              <span className="text-xs font-semibold text-primary">Student Identity</span>
              <p className="text-xs text-muted-foreground">
                Slot will be registered to <strong>{displayName}</strong> ({displayEmail}). Token slip will generate automatically upon slot confirmation.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Preferred Time Window</label>
              <select className="w-full h-9 rounded-xl border border-border bg-card px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary">
                <option>Today: 18:00 - 19:00 (Peak Slot)</option>
                <option>Today: 19:00 - 20:00</option>
                <option>Tomorrow: 09:00 - 10:00 (Early Morning)</option>
                <option>Tomorrow: 14:00 - 15:00 (Afternoon)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Special Instructions / Hostel Wing</label>
              <input
                type="text"
                placeholder="e.g. Block B, Room 204 or Special Diet request"
                className="w-full h-9 rounded-xl border border-border bg-card px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <DialogFooter className="flex sm:justify-between gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBookingDialogOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              size="sm"
              onClick={() => {
                setBookingDialogOpen(false);
              }}
              className="text-xs gap-1.5"
            >
              <span>Confirm & Generate Token</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalShell>
  );
}

/**
 * Reusable Booking Card
 */
function BookingCard({ item }: { item: BookingItem }) {
  return (
    <Card className="bg-card/70 border-border/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-primary">{item.bookingCode}</span>
          <Badge variant="outline" className="text-[10px]">{item.categoryName}</Badge>
          <Badge
            variant={
              item.status === 'UPCOMING'
                ? 'info'
                : item.status === 'ACTIVE'
                ? 'success'
                : item.status === 'COMPLETED'
                ? 'default'
                : 'destructive'
            }
            className="text-[10px]"
          >
            {item.status}
          </Badge>
        </div>
        <h4 className="text-sm font-bold text-foreground">{item.serviceName}</h4>
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <span>{item.location}</span>
          <span>•</span>
          <span>{item.slotTime}</span>
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <span className="text-xs font-bold text-foreground">₹{item.amount}</span>
          <p className="text-[10px] text-emerald-600 font-medium">{item.paymentStatus}</p>
        </div>
        <Button variant="outline" size="sm" className="text-xs h-8">
          View Slip
        </Button>
      </div>
    </Card>
  );
}

/**
 * Reusable Empty Booking State Component
 */
function EmptyBookingState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 p-8 text-center space-y-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <div className="space-y-1 max-w-md">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onAction}
        className="mt-2 text-xs font-semibold gap-1.5"
      >
        <span>{actionLabel}</span>
        <ArrowRight className="h-3 w-3" />
      </Button>
    </div>
  );
}
