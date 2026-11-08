'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  GraduationCap,
  Building2,
  Layers,
  CheckCircle2,
  CalendarCheck,
  Clock,
  Check,
  XCircle,
  IndianRupee,
  TrendingUp,
  Search,
  BarChart3,
  PieChart,
  ShieldCheck,
  RefreshCw,
  Award,
  FolderTree,
  Star,
  Trash2,
  ShieldAlert,
  Filter,
  Loader2,
  ArrowRight,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
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
import type { AdminDashboardData, AdminReviewItem } from '@/lib/admin-dashboard-data';
import { deleteReviewAction } from '@/app/actions/review-actions';
import { toast } from 'sonner';
import { BookingStatus, Role } from '@prisma/client';

interface AdminDashboardViewProps {
  data: AdminDashboardData;
  initialTab?: 'overview' | 'bookings' | 'users' | 'revenue' | 'reviews';
}

export function AdminDashboardView({ data, initialTab = 'overview' }: AdminDashboardViewProps) {
  const router = useRouter();
  const {
    metrics,
    bookingAnalytics,
    revenueAnalytics,
    popularServices,
    recentBookings,
    recentUsers,
    reviews,
  } = data;

  const [activeTab, setActiveTab] = React.useState<
    'overview' | 'bookings' | 'users' | 'revenue' | 'reviews'
  >(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#reviews') {
      return 'reviews';
    }
    return initialTab;
  });
  const [searchQuery, setSearchQuery] = React.useState('');
  const [ratingFilter, setRatingFilter] = React.useState<'ALL' | '5' | '4' | '3' | '2' | '1'>('ALL');
  const [reviewToDelete, setReviewToDelete] = React.useState<AdminReviewItem | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#reviews') {
        setActiveTab('reviews');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.COMPLETED:
        return (
          <Badge variant="success" className="gap-1 text-[11px] font-semibold">
            <CheckCircle2 className="h-3 w-3" />
            <span>Completed</span>
          </Badge>
        );
      case BookingStatus.CONFIRMED:
        return (
          <Badge variant="info" className="gap-1 text-[11px] font-semibold">
            <Check className="h-3 w-3" />
            <span>Confirmed</span>
          </Badge>
        );
      case BookingStatus.PENDING:
        return (
          <Badge variant="warning" className="gap-1 text-[11px] font-semibold">
            <Clock className="h-3 w-3" />
            <span>Pending</span>
          </Badge>
        );
      case BookingStatus.CANCELLED:
        return (
          <Badge variant="destructive" className="gap-1 text-[11px] font-semibold">
            <XCircle className="h-3 w-3" />
            <span>Cancelled</span>
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: Role | string | null) => {
    const roleStr = String(role || '');
    if (roleStr === 'ADMIN') {
      return <Badge variant="destructive" className="text-[10px]">ADMIN</Badge>;
    }
    if (roleStr === 'SERVICE_PROVIDER') {
      return <Badge variant="warning" className="text-[10px]">PROVIDER</Badge>;
    }
    if (roleStr === 'STUDENT') {
      return <Badge variant="info" className="text-[10px]">STUDENT</Badge>;
    }
    return <Badge variant="secondary" className="text-[10px]">UNASSIGNED</Badge>;
  };

  const filteredBookings = recentBookings.filter(
    (b) =>
      b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.serviceName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReviews = reviews.filter((r) => {
    if (ratingFilter !== 'ALL' && r.rating !== Number(ratingFilter)) {
      return false;
    }
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.studentName.toLowerCase().includes(q) ||
      r.studentEmail.toLowerCase().includes(q) ||
      r.serviceName.toLowerCase().includes(q) ||
      r.providerName.toLowerCase().includes(q) ||
      r.bookingCode.toLowerCase().includes(q) ||
      (r.comment && r.comment.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner / Command Welcome */}
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-r from-blue-900/20 via-indigo-900/15 to-purple-900/20 p-6 sm:p-8 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Campus Central Command • PostgreSQL Real-Time Telemetry</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
              University System Administration
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Global oversight across verified students, authorized service providers, booking work orders, and financial reconciliation powered by Prisma ORM.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/admin/categories">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs font-semibold bg-background/60 hover:bg-muted"
              >
                <FolderTree className="h-3.5 w-3.5 text-blue-500" />
                <span>Manage Categories</span>
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="gap-1.5 text-xs font-semibold bg-background/60"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Sync Telemetry</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 10 CORE METRICS GRID */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span>Prisma Database System Counters</span>
          </h2>
          <span className="text-xs text-muted-foreground">Live Database Aggregates</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {/* 1. Total Users */}
          <Card className="bg-card/70 backdrop-blur-md border-border/70 hover:shadow-md transition-all">
            <CardHeader className="p-4 pb-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <CardDescription className="text-[11px] font-semibold uppercase tracking-wider">
                  Total Users
                </CardDescription>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                  <Users className="h-3.5 w-3.5" />
                </div>
              </div>
              <CardTitle className="text-2xl font-black text-foreground mt-1">
                {metrics.totalUsers}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
              All registered identities
            </CardContent>
          </Card>

          {/* 2. Students */}
          <Card className="bg-card/70 backdrop-blur-md border-border/70 hover:shadow-md transition-all">
            <CardHeader className="p-4 pb-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <CardDescription className="text-[11px] font-semibold uppercase tracking-wider">
                  Students
                </CardDescription>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
                  <GraduationCap className="h-3.5 w-3.5" />
                </div>
              </div>
              <CardTitle className="text-2xl font-black text-foreground mt-1">
                {metrics.students}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
              Enrolled student accounts
            </CardContent>
          </Card>

          {/* 3. Service Providers */}
          <Card className="bg-card/70 backdrop-blur-md border-border/70 hover:shadow-md transition-all">
            <CardHeader className="p-4 pb-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <CardDescription className="text-[11px] font-semibold uppercase tracking-wider">
                  Service Providers
                </CardDescription>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
                  <Building2 className="h-3.5 w-3.5" />
                </div>
              </div>
              <CardTitle className="text-2xl font-black text-foreground mt-1">
                {metrics.serviceProviders}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
              Campus service desks
            </CardContent>
          </Card>

          {/* 4. Total Services */}
          <Card className="bg-card/70 backdrop-blur-md border-border/70 hover:shadow-md transition-all">
            <CardHeader className="p-4 pb-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <CardDescription className="text-[11px] font-semibold uppercase tracking-wider">
                  Total Services
                </CardDescription>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600">
                  <Layers className="h-3.5 w-3.5" />
                </div>
              </div>
              <CardTitle className="text-2xl font-black text-foreground mt-1">
                {metrics.totalServices}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
              Catalog offerings
            </CardContent>
          </Card>

          {/* 5. Active Services */}
          <Card className="bg-card/70 backdrop-blur-md border-border/70 hover:shadow-md transition-all">
            <CardHeader className="p-4 pb-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <CardDescription className="text-[11px] font-semibold uppercase tracking-wider">
                  Active Services
                </CardDescription>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
              </div>
              <CardTitle className="text-2xl font-black text-emerald-600 mt-1">
                {metrics.activeServices}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
              Available for booking
            </CardContent>
          </Card>

          {/* 6. Total Bookings */}
          <Card className="bg-card/70 backdrop-blur-md border-border/70 hover:shadow-md transition-all">
            <CardHeader className="p-4 pb-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <CardDescription className="text-[11px] font-semibold uppercase tracking-wider">
                  Total Bookings
                </CardDescription>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                  <CalendarCheck className="h-3.5 w-3.5" />
                </div>
              </div>
              <CardTitle className="text-2xl font-black text-foreground mt-1">
                {metrics.totalBookings}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
              Lifetime requests
            </CardContent>
          </Card>

          {/* 7. Pending Bookings */}
          <Card className="bg-card/70 backdrop-blur-md border-border/70 hover:shadow-md transition-all">
            <CardHeader className="p-4 pb-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <CardDescription className="text-[11px] font-semibold uppercase tracking-wider">
                  Pending Bookings
                </CardDescription>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                  <Clock className="h-3.5 w-3.5" />
                </div>
              </div>
              <CardTitle className="text-2xl font-black text-amber-600 mt-1">
                {metrics.pendingBookings}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
              Awaiting confirmation
            </CardContent>
          </Card>

          {/* 8. Completed Bookings */}
          <Card className="bg-card/70 backdrop-blur-md border-border/70 hover:shadow-md transition-all">
            <CardHeader className="p-4 pb-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <CardDescription className="text-[11px] font-semibold uppercase tracking-wider">
                  Completed Bookings
                </CardDescription>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <Check className="h-3.5 w-3.5" />
                </div>
              </div>
              <CardTitle className="text-2xl font-black text-emerald-600 mt-1">
                {metrics.completedBookings}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
              Fulfilled services
            </CardContent>
          </Card>

          {/* 9. Cancelled Bookings */}
          <Card className="bg-card/70 backdrop-blur-md border-border/70 hover:shadow-md transition-all">
            <CardHeader className="p-4 pb-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <CardDescription className="text-[11px] font-semibold uppercase tracking-wider">
                  Cancelled Bookings
                </CardDescription>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-600">
                  <XCircle className="h-3.5 w-3.5" />
                </div>
              </div>
              <CardTitle className="text-2xl font-black text-red-600 mt-1">
                {metrics.cancelledBookings}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
              Revoked or rejected
            </CardContent>
          </Card>

          {/* 10. Total Revenue */}
          <Card className="bg-card/70 backdrop-blur-md border-border/70 hover:shadow-md transition-all col-span-2 sm:col-span-1">
            <CardHeader className="p-4 pb-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <CardDescription className="text-[11px] font-semibold uppercase tracking-wider">
                  Total Revenue
                </CardDescription>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <IndianRupee className="h-3.5 w-3.5" />
                </div>
              </div>
              <CardTitle className="text-2xl font-black text-emerald-600 mt-1">
                {formatCurrency(metrics.totalRevenue)}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
              Settled turnover
            </CardContent>
          </Card>

          {/* 11. Campus Reviews */}
          <Card className="bg-card/70 backdrop-blur-md border-border/70 hover:shadow-md transition-all">
            <CardHeader className="p-4 pb-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <CardDescription className="text-[11px] font-semibold uppercase tracking-wider">
                  Campus Reviews
                </CardDescription>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                  <Star className="h-3.5 w-3.5 fill-amber-500" />
                </div>
              </div>
              <CardTitle className="text-2xl font-black text-amber-500 mt-1">
                {metrics.totalReviews}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
              Verified submissions
            </CardContent>
          </Card>

          {/* 12. Average Campus Rating */}
          <Card className="bg-card/70 backdrop-blur-md border-border/70 hover:shadow-md transition-all">
            <CardHeader className="p-4 pb-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <CardDescription className="text-[11px] font-semibold uppercase tracking-wider">
                  Campus Avg Rating
                </CardDescription>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                  <Award className="h-3.5 w-3.5" />
                </div>
              </div>
              <CardTitle className="text-2xl font-black text-foreground mt-1">
                {metrics.averageRating > 0 ? `${metrics.averageRating.toFixed(1)} ★` : '—'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
              University satisfaction
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Analytics Section Header with Full Report Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <h2 className="text-xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <span>Campus Telemetry & Operations Snapshot</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Key operational metrics across booking workflows and amenity revenues
          </p>
        </div>
        <Link href="/admin/analytics">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-semibold rounded-xl border-border/80 hover:bg-primary hover:text-primary-foreground transition-all">
            <span>Explore Full Analytics Center</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {/* ANALYTICS CHARTS SECTION: Booking & Revenue Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Booking Analytics by Status */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-blue-500" />
                  <span>Booking Status Analytics</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Distribution of lifecycle statuses across all campus requests
                </CardDescription>
              </div>
              <Badge variant="glow" className="text-[11px]">
                {metrics.totalBookings} Total
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Visual Multi-Segment Distribution Bar */}
            <div className="space-y-2">
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted/60">
                {bookingAnalytics.byStatus.map((item) => (
                  <div
                    key={item.status}
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                    title={`${item.status}: ${item.count} (${item.percentage}%)`}
                    className="transition-all duration-500"
                  />
                ))}
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>0%</span>
                <span>Fulfillment Rate: {metrics.totalBookings > 0 ? Math.round((metrics.completedBookings / metrics.totalBookings) * 100) : 0}%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Status Breakdown Legend & Counts */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {bookingAnalytics.byStatus.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs font-semibold text-foreground">
                      {item.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-foreground">
                      {item.count}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-1">
                      ({item.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* 7-Day Booking Trend Sparkline */}
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-semibold text-muted-foreground">7-Day Booking Volume</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px] flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Real-Time Traffic
                </span>
              </div>
              <div className="flex items-end justify-between h-20 gap-2 pt-2 px-1">
                {bookingAnalytics.timeline.map((point) => {
                  const maxBooking = Math.max(...bookingAnalytics.timeline.map((t) => t.bookings), 1);
                  const barHeight = Math.max(15, Math.round((point.bookings / maxBooking) * 100));
                  return (
                    <div key={point.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <div className="relative w-full flex justify-center">
                        <div
                          style={{ height: `${barHeight}%` }}
                          className="w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-blue-600 to-indigo-500 transition-all duration-300 group-hover:from-blue-500 group-hover:to-indigo-400 shadow-sm"
                        />
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {point.dayLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Revenue Analytics by Category */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span>Revenue Analytics by Category</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Financial turnover generated across campus amenity categories
                </CardDescription>
              </div>
              <Badge variant="success" className="text-[11px] gap-1">
                <IndianRupee className="h-3 w-3" />
                <span>{formatCurrency(metrics.totalRevenue)}</span>
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Category Performance Bars */}
            <div className="space-y-3.5">
              {revenueAnalytics.byCategory.map((item) => (
                <div key={item.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{item.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-[11px]">
                        {item.bookingCount} orders
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
                    <div
                      style={{ width: `${Math.max(item.percentage, 8)}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* 7-Day Revenue Trend Bars */}
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-semibold text-muted-foreground">7-Day Revenue Trajectory</span>
                <span className="text-muted-foreground text-[11px]">Past 7 Days</span>
              </div>
              <div className="flex items-end justify-between h-20 gap-2 pt-2 px-1">
                {revenueAnalytics.timeline.map((point) => {
                  const maxRev = Math.max(...revenueAnalytics.timeline.map((t) => t.revenue), 1);
                  const barHeight = Math.max(15, Math.round((point.revenue / maxRev) * 100));
                  return (
                    <div key={point.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <div className="relative w-full flex justify-center">
                        <div
                          style={{ height: `${barHeight}%` }}
                          className="w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-emerald-600 to-teal-500 transition-all duration-300 group-hover:from-emerald-500 group-hover:to-teal-400 shadow-sm"
                        />
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {point.dayLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* POPULAR SERVICES SECTION */}
      <div id="services">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              <span>Popular Campus Services</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Ranked by total student booking volume and customer demand
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/services">
              <Button variant="outline" size="sm" className="h-7 text-xs font-semibold gap-1">
                <span>Manage All Services</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {popularServices.map((svc, index) => (
            <Card key={svc.id} className="bg-card/70 backdrop-blur-sm border-border/70 hover:shadow-md transition-all">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <Badge variant="secondary" className="text-[10px] uppercase font-semibold">
                      {svc.category}
                    </Badge>
                    <CardTitle className="text-sm font-bold text-foreground leading-snug">
                      {svc.name}
                    </CardTitle>
                  </div>
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 font-bold text-xs">
                    #{index + 1}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-2 space-y-3">
                <div className="flex items-center justify-between text-xs pt-2 border-t border-border/60">
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-muted-foreground">Standard Rate</span>
                    <p className="font-bold text-foreground">
                      {svc.price === 0 ? 'Complimentary' : formatCurrency(svc.price)}
                    </p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="text-[11px] text-muted-foreground">Total Bookings</span>
                    <p className="font-bold text-primary">{svc.bookingCount} slots</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <span>Status: <strong className="text-emerald-600">Active</strong></span>
                  <span>Turnover: <strong className="text-foreground">{formatCurrency(svc.totalRevenue)}</strong></span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* TABLES SECTION: Recent Bookings & Recent Users */}
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === 'overview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('overview')}
              className="text-xs font-semibold"
            >
              All Records
            </Button>
            <Button
              variant={activeTab === 'bookings' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('bookings')}
              className="text-xs font-semibold"
            >
              Recent Bookings ({recentBookings.length})
            </Button>
            <Button
              variant={activeTab === 'users' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('users')}
              className="text-xs font-semibold"
            >
              Recent Users ({recentUsers.length})
            </Button>
            <Button
              variant={activeTab === 'reviews' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('reviews')}
              className="text-xs font-semibold gap-1.5"
            >
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span>Reviews & Moderation ({reviews.length})</span>
            </Button>
          </div>

          {/* Table Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search code, student, service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/40 py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Table 1: Recent Bookings */}
        {(activeTab === 'overview' || activeTab === 'bookings') && (
          <div id="bookings" className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-blue-500" />
                <span>Recent Booking Work Orders</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">Queried directly from Prisma `db.booking`</span>
                <Link href="/admin/bookings">
                  <Button variant="outline" size="sm" className="h-7 text-xs font-semibold gap-1">
                    <span>Manage All Bookings</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Mobile Cards View for Bookings (Block on mobile, hidden on md+) */}
            <div className="block md:hidden">
              {filteredBookings.length === 0 ? (
                <div className="rounded-2xl border border-border/80 p-6 text-center text-xs text-muted-foreground bg-card/60">
                  No bookings match your search query.
                </div>
              ) : (
                <div className="divide-y divide-border/40 rounded-2xl border border-border/80 overflow-hidden bg-card/60">
                  {filteredBookings.map((b) => (
                    <div key={b.id} className="p-3.5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/60">
                          {b.bookingCode}
                        </span>
                        {getStatusBadge(b.status)}
                      </div>
                      <div className="text-xs">
                        <p className="font-semibold text-foreground">{b.serviceName}</p>
                        <p className="text-[11px] text-muted-foreground">by {b.studentName} ({b.studentEmail})</p>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/30">
                        <span>{b.scheduledAt}</span>
                        <span className="font-bold text-foreground">{formatCurrency(b.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Table View (Hidden on mobile, block on md+) */}
            <div className="hidden md:block rounded-2xl border border-border/80 overflow-x-auto bg-card/60 backdrop-blur-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Booking Code</TableHead>
                    <TableHead className="text-xs">Student</TableHead>
                    <TableHead className="text-xs">Service & Category</TableHead>
                    <TableHead className="text-xs">Scheduled Slot</TableHead>
                    <TableHead className="text-xs">Amount</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                        No bookings match your search query.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBookings.map((b) => (
                      <TableRow key={b.id} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-xs font-bold text-foreground">
                          {b.bookingCode}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="text-xs font-semibold text-foreground">{b.studentName}</p>
                            <p className="text-[11px] text-muted-foreground">{b.studentEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="text-xs font-medium text-foreground">{b.serviceName}</p>
                            <p className="text-[10px] text-muted-foreground">{b.category}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {b.scheduledAt}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-foreground">
                          {formatCurrency(b.amount)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(b.status)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Table 2: Recent Users */}
        {(activeTab === 'overview' || activeTab === 'users') && (
          <div id="users" className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-500" />
                <span>Recent Platform Users</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">Queried directly from Prisma `db.user`</span>
                <Link href="/admin/users">
                  <Button variant="outline" size="sm" className="h-7 text-xs font-semibold gap-1">
                    <span>Manage All Users</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Mobile Cards View for Users (Block on mobile, hidden on md+) */}
            <div className="block md:hidden">
              {recentUsers.length === 0 ? (
                <div className="rounded-2xl border border-border/80 p-6 text-center text-xs text-muted-foreground bg-card/60">
                  No recent users found.
                </div>
              ) : (
                <div className="divide-y divide-border/40 rounded-2xl border border-border/80 overflow-hidden bg-card/60">
                  {recentUsers.map((u) => (
                    <div key={u.id} className="p-3.5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-foreground">{u.name}</span>
                        {getRoleBadge(u.role)}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/30">
                        <span className="font-mono text-[10px] text-muted-foreground">{u.id.slice(0, 10)}...</span>
                        <span>{u.createdAt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Table View (Hidden on mobile, block on md+) */}
            <div className="hidden md:block rounded-2xl border border-border/80 overflow-x-auto bg-card/60 backdrop-blur-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">User ID</TableHead>
                    <TableHead className="text-xs">Full Name</TableHead>
                    <TableHead className="text-xs">Email Address</TableHead>
                    <TableHead className="text-xs">Assigned Role</TableHead>
                    <TableHead className="text-xs">Joined Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentUsers.map((u) => (
                    <TableRow key={u.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-[11px] text-muted-foreground">
                        {u.id.slice(0, 10)}...
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-foreground">
                        {u.name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(u.role)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {u.createdAt}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Section 3: Student Reviews & Content Moderation Desk */}
        {(activeTab === 'overview' || activeTab === 'reviews') && (
          <div id="reviews" className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span>Student Reviews & Moderation Desk</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Inspect student ratings, monitor service quality, and moderate inappropriate or abusive content.
                </p>
              </div>

              {/* Star Rating Quick Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 mr-1">
                  <Filter className="h-3 w-3" />
                  Rating:
                </span>
                {(['ALL', '5', '4', '3', '2', '1'] as const).map((r) => (
                  <Button
                    key={r}
                    variant={ratingFilter === r ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRatingFilter(r)}
                    className="h-6 text-[10px] px-2 font-semibold"
                  >
                    {r === 'ALL' ? 'All' : `${r}★`}
                  </Button>
                ))}
              </div>
            </div>

            {/* Mobile Cards View for Reviews (Block on mobile, hidden on md+) */}
            <div className="block md:hidden">
              {filteredReviews.length === 0 ? (
                <div className="rounded-2xl border border-border/80 p-6 text-center text-xs text-muted-foreground bg-card/60">
                  No student reviews found.
                </div>
              ) : (
                <div className="divide-y divide-border/40 rounded-2xl border border-border/80 overflow-hidden bg-card/60">
                  {filteredReviews.map((rev) => (
                    <div key={rev.id} className="p-3.5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                          <Star className="h-3.5 w-3.5 fill-amber-500" />
                          <span>{rev.rating}.0</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{rev.createdAt}</span>
                      </div>
                      <div className="text-xs">
                        <p className="font-semibold text-foreground">{rev.serviceName}</p>
                        <p className="text-[11px] text-muted-foreground">Provider: {rev.providerName}</p>
                      </div>
                      {rev.comment && (
                        <p className="text-xs text-foreground italic bg-muted/30 p-2 rounded-lg line-clamp-2">
                          &ldquo;{rev.comment}&rdquo;
                        </p>
                      )}
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/30">
                        <span className="text-muted-foreground">By {rev.studentName}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReviewToDelete(rev)}
                          className="h-7 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 px-2"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          <span>Remove</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Table View (Hidden on mobile, block on md+) */}
            <div className="hidden md:block rounded-2xl border border-border/80 overflow-x-auto bg-card/60 backdrop-blur-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Rating</TableHead>
                    <TableHead className="text-xs">Student</TableHead>
                    <TableHead className="text-xs">Service & Provider</TableHead>
                    <TableHead className="text-xs max-w-xs">Feedback / Comment</TableHead>
                    <TableHead className="text-xs">Booking Ref</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs text-right">Moderation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground space-y-1">
                        <Star className="h-6 w-6 text-muted-foreground/40 mx-auto mb-1" />
                        <p className="font-semibold text-foreground">No student reviews found</p>
                        <p className="text-[11px]">
                          {searchQuery || ratingFilter !== 'ALL'
                            ? 'Try clearing the search query or changing the star rating filter.'
                            : 'No student reviews have been submitted in the database yet.'}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReviews.map((rev) => (
                      <TableRow key={rev.id} className="hover:bg-muted/30">
                        {/* Rating */}
                        <TableCell>
                          <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                            <Star className="h-3.5 w-3.5 fill-amber-500" />
                            <span>{rev.rating}.0</span>
                          </div>
                        </TableCell>

                        {/* Student */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="text-xs font-semibold text-foreground">{rev.studentName}</p>
                            <p className="text-[11px] text-muted-foreground">{rev.studentEmail}</p>
                          </div>
                        </TableCell>

                        {/* Service & Provider */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="text-xs font-medium text-foreground">{rev.serviceName}</p>
                            <p className="text-[10px] text-muted-foreground">by {rev.providerName}</p>
                          </div>
                        </TableCell>

                        {/* Feedback / Comment */}
                        <TableCell className="max-w-xs">
                          {rev.comment ? (
                            <p className="text-xs text-foreground italic leading-relaxed line-clamp-2">
                              &ldquo;{rev.comment}&rdquo;
                            </p>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              (No written comment)
                            </span>
                          )}
                        </TableCell>

                        {/* Booking Ref */}
                        <TableCell className="font-mono text-[11px] font-semibold text-muted-foreground">
                          {rev.bookingCode}
                        </TableCell>

                        {/* Date */}
                        <TableCell className="text-xs text-muted-foreground">
                          {rev.formattedDate}
                        </TableCell>

                        {/* Moderation Action */}
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setReviewToDelete(rev)}
                            className="h-7 text-xs font-semibold gap-1 px-2.5"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Delete</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* Admin Review Moderation Deletion Dialog */}
      <Dialog open={!!reviewToDelete} onOpenChange={(open) => !open && setReviewToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              Moderate & Remove Review
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed pt-2">
              Are you sure you want to permanently delete this student review from CampusServe? This action cannot be reversed.
            </DialogDescription>
          </DialogHeader>

          {reviewToDelete && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">{reviewToDelete.studentName}</span>
                <span className="text-amber-500 font-bold flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-500" />
                  {reviewToDelete.rating}.0 / 5.0
                </span>
              </div>
              <p className="text-foreground italic bg-background/60 p-2.5 rounded-lg border border-border/40">
                &ldquo;{reviewToDelete.comment || 'No written comment'}&rdquo;
              </p>
              <div className="text-[11px] text-muted-foreground space-y-0.5 pt-1">
                <p>
                  <strong>Service:</strong> {reviewToDelete.serviceName}
                </p>
                <p>
                  <strong>Booking Reference:</strong>{' '}
                  <span className="font-mono">{reviewToDelete.bookingCode}</span>
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReviewToDelete(null)}
              disabled={isDeleting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={async () => {
                if (!reviewToDelete) return;
                setIsDeleting(true);
                try {
                  const res = await deleteReviewAction(reviewToDelete.id);
                  if (res.success) {
                    toast.success('Review permanently deleted by administration.');
                    setReviewToDelete(null);
                    router.refresh();
                  } else {
                    toast.error(res.error || 'Failed to delete review.');
                  }
                } catch (err: unknown) {
                  const msg = err instanceof Error ? err.message : 'Error moderating review.';
                  toast.error(msg);
                } finally {
                  setIsDeleting(false);
                }
              }}
              className="text-xs font-semibold gap-1.5"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Removing Review...
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  Confirm Permanent Removal
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
