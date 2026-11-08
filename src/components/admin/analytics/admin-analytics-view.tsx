'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  IndianRupee,
  CalendarDays,
  Users,
  Star,
  RefreshCw,
  FileDown,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getAdminAnalyticsData,
  type AdminAnalyticsData,
  type AnalyticsTimeRange,
} from '@/app/actions/admin-analytics-actions';
import { TimelineAreaChart } from './charts/timeline-area-chart';
import { DistributionDonutChart } from './charts/distribution-donut-chart';
import { LeaderboardLists } from './charts/leaderboard-lists';
import { RatingsAnalyticsCard } from './charts/ratings-analytics-card';
import { UserGrowthCard } from './charts/user-growth-card';

interface AdminAnalyticsViewProps {
  initialData: AdminAnalyticsData;
}

export function AdminAnalyticsView({ initialData }: AdminAnalyticsViewProps) {
  const [data, setData] = useState<AdminAnalyticsData>(initialData);
  const [isPending, startTransition] = useTransition();

  const handleRangeChange = (newRange: AnalyticsTimeRange) => {
    if (newRange === data.timeRange && !isPending) return;

    startTransition(async () => {
      try {
        const updated = await getAdminAnalyticsData(newRange);
        setData(updated);
        toast.success(`Analytics updated for ${getRangeLabel(newRange)}`);
      } catch (err: unknown) {
        console.error('Failed to update analytics range:', err);
        toast.error('Failed to load telemetry for selected timeframe.');
      }
    });
  };

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const refreshed = await getAdminAnalyticsData(data.timeRange);
        setData(refreshed);
        toast.success('Prisma database telemetry refreshed');
      } catch (err: unknown) {
        console.error('Failed to refresh analytics:', err);
        toast.error('Failed to refresh database analytics.');
      }
    });
  };

  const handleExportSummary = () => {
    const summary = {
      generatedAt: new Date().toISOString(),
      timeRange: data.timeRange,
      kpis: data.metrics,
      topServices: data.popularServices.map((s) => ({
        name: s.name,
        category: s.category,
        bookings: s.totalBookings,
        revenue: s.totalRevenue,
      })),
      topProviders: data.activeProviders.map((p) => ({
        name: p.name,
        services: p.servicesCount,
        bookings: p.totalBookings,
        turnover: p.totalRevenue,
      })),
    };

    const blob = new Blob([JSON.stringify(summary, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campus-analytics-report-${data.timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Analytics report exported as JSON');
  };

  const getRangeLabel = (r: AnalyticsTimeRange) => {
    switch (r) {
      case '7d':
        return 'Last 7 Days';
      case '30d':
        return 'Last 30 Days';
      case '90d':
        return 'Last 90 Days';
      case 'all':
        return 'All Time (1 Year)';
      default:
        return 'Selected Range';
    }
  };

  const { metrics } = data;

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header & Range Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Campus Operations Analytics
            </h1>
            <Badge variant="glow" className="text-xs font-semibold gap-1">
              <Activity className="h-3 w-3 text-emerald-500 animate-pulse" />
              <span>Live DB Telemetry</span>
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Institutional intelligence, financial settlement tracking, demand forecasting, and service quality audit
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time range selector */}
          <div className="flex items-center rounded-xl bg-muted/60 p-1 border border-border/60">
            {(['7d', '30d', '90d', 'all'] as AnalyticsTimeRange[]).map((r) => (
              <button
                key={r}
                type="button"
                disabled={isPending}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  data.timeRange === r
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => handleRangeChange(r)}
              >
                {r === '7d'
                  ? '7 Days'
                  : r === '30d'
                  ? '30 Days'
                  : r === '90d'
                  ? '90 Days'
                  : 'All Time'}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handleRefresh}
            className="h-8 gap-1.5 text-xs font-semibold rounded-xl border-border/70"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          {/* Export Report */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportSummary}
            className="h-8 gap-1.5 text-xs font-semibold rounded-xl border-border/70"
          >
            <FileDown className="h-3.5 w-3.5" />
            <span>Export Report</span>
          </Button>
        </div>
      </div>

      {/* Primary KPI Ribbon (Database-driven calculations) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Gross Settled Revenue */}
        <Card className="bg-card/85 backdrop-blur-md border-border/80 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
          <CardHeader className="p-4 sm:p-5 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Gross Settled Revenue
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <IndianRupee className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              ₹{metrics.totalRevenue.toLocaleString('en-IN')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 text-xs text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {metrics.successfulPaymentsCount} paid orders
            </span>
            <span className="text-[11px] font-mono">
              Success: {metrics.paymentSuccessRate}%
            </span>
          </CardContent>
        </Card>

        {/* KPI 2: Campus Bookings Volume */}
        <Card className="bg-card/85 backdrop-blur-md border-border/80 shadow-sm relative overflow-hidden group hover:border-blue-500/50 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
          <CardHeader className="p-4 sm:p-5 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Total Bookings Volume
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                <CalendarDays className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-black font-mono text-foreground mt-1">
              {metrics.totalBookings}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 text-xs text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {metrics.completedBookings} completed
            </span>
            <span className="text-[11px] font-mono">
              Fulfillment: {metrics.fulfillmentRate}%
            </span>
          </CardContent>
        </Card>

        {/* KPI 3: Registered University Users */}
        <Card className="bg-card/85 backdrop-blur-md border-border/80 shadow-sm relative overflow-hidden group hover:border-purple-500/50 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all" />
          <CardHeader className="p-4 sm:p-5 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Campus Accounts
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-black font-mono text-foreground mt-1">
              {metrics.totalUsers}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 text-xs text-muted-foreground flex items-center justify-between">
            <span>
              <strong className="text-foreground">{metrics.studentUsers}</strong> students
            </span>
            <span>
              <strong className="text-foreground">{metrics.providerUsers}</strong> providers
            </span>
          </CardContent>
        </Card>

        {/* KPI 4: Campus Quality Score */}
        <Card className="bg-card/85 backdrop-blur-md border-border/80 shadow-sm relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
          <CardHeader className="p-4 sm:p-5 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Average Satisfaction
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                <Star className="h-4 w-4 fill-amber-500" />
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-black font-mono text-amber-500 mt-1">
              {metrics.averageRating > 0 ? `${metrics.averageRating.toFixed(1)} ★` : '—'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 text-xs text-muted-foreground flex items-center justify-between">
            <span>{metrics.totalReviews} verified reviews</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              Top Tier Quality
            </span>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 1: Bookings & Revenue Over Time (Interactive Area Chart) */}
      <div>
        <TimelineAreaChart data={data.timeline} />
      </div>

      {/* SECTION 2: Status Distributions (Side-by-side Donut Rings) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DistributionDonutChart
          title="Booking Status Distribution"
          description="Proportion of bookings across complete university workflow lifecycle"
          icon={CalendarDays}
          badgeLabel={`${metrics.totalBookings} Total`}
          data={data.bookingStatusDistribution}
          centerLabel="Bookings"
        />

        <DistributionDonutChart
          title="Payment Status Distribution"
          description="Reconciliation of campus payments, settled funds, and refunds"
          icon={IndianRupee}
          badgeLabel={`₹${metrics.totalRevenue.toLocaleString('en-IN')}`}
          data={data.paymentStatusDistribution}
          centerLabel="Total Turnover"
          isCurrency={true}
        />
      </div>

      {/* SECTION 3: Operations Leaderboard (Top Services & Providers) */}
      <div>
        <LeaderboardLists
          services={data.popularServices}
          providers={data.activeProviders}
        />
      </div>

      {/* SECTION 4: Student Satisfaction & Reviews Breakdown */}
      <div>
        <RatingsAnalyticsCard ratings={data.ratings} />
      </div>

      {/* SECTION 5: Platform Adoption & User Growth */}
      <div>
        <UserGrowthCard userGrowth={data.userGrowth} />
      </div>
    </div>
  );
}
