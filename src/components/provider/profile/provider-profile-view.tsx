'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import {
  Building2,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  Star,
  Wrench,
  Inbox,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit3,
  ExternalLink,
  Plus,
  Loader2,
  Lock,
  Sparkles,
  MapPin,
  CreditCard,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import {
  updateProviderProfileAction,
  type ProviderProfileData,
} from '@/app/actions/provider-profile-actions';
import {
  switchUserRole,
  getProviderActiveObligations,
} from '@/app/actions/role-actions';
import { invalidateClientRoleCache } from '@/hooks/use-user-role';

interface ProviderProfileViewProps {
  initialData: ProviderProfileData;
}

const STORAGE_KEY = 'campusserve_provider_profile_prefs';

interface ProviderPreferences {
  businessName: string;
  campusLocation: string;
  operatingHours: string;
  businessBio: string;
  emergencyContact: string;
  payoutUpi: string;
}

export function ProviderProfileView({ initialData }: ProviderProfileViewProps) {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const { openUserProfile } = useClerk();

  // Primary user states (persisted in DB)
  const [name, setName] = React.useState(initialData.name || '');
  const [phone, setPhone] = React.useState(initialData.phone || '');
  const [isSaving, setIsSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('overview');

  // Application-specific provider business preferences (hydrated from localStorage)
  const [prefs, setPrefs] = React.useState<ProviderPreferences>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch {
        // Fallback to defaults
      }
    }
    return {
      businessName: 'Campus Facility Services & Operations',
      campusLocation: 'Student Activity Center (SAC), Ground Floor Booth #104',
      operatingHours: 'Mon - Sat: 08:30 AM - 07:00 PM',
      businessBio:
        'Official university service provider offering reliable on-campus laundry, facility management, and student equipment support.',
      emergencyContact: '+91 98765 43210',
      payoutUpi: 'campusserve.provider@okhdfcbank',
    };
  });

  // Role switching modal state
  const [isSwitchRoleModalOpen, setIsSwitchRoleModalOpen] = React.useState(false);
  const [isCheckingObligations, setIsCheckingObligations] = React.useState(false);
  const [activeObligationsCount, setActiveObligationsCount] = React.useState(0);
  const [isSwitchingRole, setIsSwitchingRole] = React.useState(false);

  // Sync clerk display name fallback
  const displayName =
    (name && !name.startsWith('user_') ? name : null) ||
    clerkUser?.fullName ||
    clerkUser?.firstName ||
    'Campus Service Provider';
  const displayEmail =
    clerkUser?.primaryEmailAddress?.emailAddress ||
    (initialData.email && !initialData.email.startsWith('user_')
      ? initialData.email
      : 'provider@campus.edu');
  const avatarUrl = clerkUser?.imageUrl || initialData.avatarUrl;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // 1. Update first-class fields (name, phone) in PostgreSQL with strict authorization
      const result = await updateProviderProfileAction({
        name,
        phone,
      });

      if (!result.success) {
        toast.error(result.error || 'Failed to update profile in database.');
        setIsSaving(false);
        return;
      }

      // 2. Persist application-specific business preferences
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      }

      toast.success('Provider profile updated successfully!', {
        description: 'Your changes have been saved to Neon PostgreSQL.',
      });

      router.refresh();
    } catch (err: unknown) {
      console.error('[handleSaveProfile error]:', err);
      toast.error('An unexpected error occurred while saving your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenSwitchRoleModal = async () => {
    setIsCheckingObligations(true);
    setIsSwitchRoleModalOpen(true);

    try {
      const res = await getProviderActiveObligations();
      setActiveObligationsCount(res.activeBookingsCount);
    } catch {
      setActiveObligationsCount(0);
    } finally {
      setIsCheckingObligations(false);
    }
  };

  const handleConfirmSwitchToStudent = async () => {
    setIsSwitchingRole(true);
    try {
      const result = await switchUserRole('STUDENT');
      if (!result.success) {
        toast.error(result.error || 'Could not switch role. Please try again.');
        setIsSwitchingRole(false);
        return;
      }

      invalidateClientRoleCache();
      toast.success('Account switched to Student perspective!', {
        description: 'Redirecting to your Student Services Dashboard...',
      });

      setIsSwitchRoleModalOpen(false);
      router.replace('/student/dashboard');
      router.refresh();
    } catch (err: unknown) {
      console.error('[handleConfirmSwitchToStudent error]:', err);
      toast.error('Failed to switch role due to a network or server error.');
      setIsSwitchingRole(false);
    }
  };

  const { performance, services, recentReviews } = initialData;

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Top Identity Card */}
      <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card via-card/90 to-card/60 shadow-xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl object-cover ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/10"
                />
              ) : (
                <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-violet-600 text-3xl font-extrabold text-white shadow-lg shadow-indigo-500/20">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                    {displayName}
                  </h1>
                  <Badge variant="glow" className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border-indigo-500/30">
                    <Building2 className="h-3 w-3 mr-1 text-indigo-400" />
                    Service Provider
                  </Badge>
                </div>

                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <span className="font-semibold text-foreground/90">{prefs.businessName}</span>
                </p>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{displayEmail}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{phone || 'No phone set'}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{initialData.formattedJoinedDate}</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0.5 border-border/60">
                    <ShieldCheck className="h-3 w-3 text-emerald-500" />
                    <span>Clerk Verified</span>
                  </Badge>
                  <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0.5 border-border/60">
                    <Building2 className="h-3 w-3 text-blue-500" />
                    <span>PostgreSQL Sync</span>
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-mono">
                    ID: {initialData.id.slice(0, 10)}...
                  </Badge>
                </div>
              </div>
            </div>

            {/* Quick Header Actions */}
            <div className="flex flex-wrap sm:flex-col gap-2 w-full md:w-auto">
              <Button
                variant="gradient"
                size="sm"
                onClick={() => setActiveTab('edit')}
                className="gap-1.5 text-xs font-semibold shadow-md shadow-indigo-500/20"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Profile</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenSwitchRoleModal}
                className="gap-1.5 text-xs font-medium"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Switch to Student Role</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (openUserProfile) {
                    openUserProfile();
                  } else {
                    router.push('/profile');
                  }
                }}
                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Clerk Security Settings</span>
              </Button>
            </div>
          </div>

          {/* Quick Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-border/60">
            <div className="rounded-xl border border-border/50 bg-card/50 p-3.5 space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Average Rating</span>
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-foreground">
                  {performance.overallAverageRating > 0 ? performance.overallAverageRating : '5.0'}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({performance.totalReviews} reviews)
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-border/50 bg-card/50 p-3.5 space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Total Bookings</span>
                <Inbox className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-foreground">
                  {performance.totalBookings}
                </span>
                <span className="text-xs text-emerald-500 font-semibold">
                  {performance.completedBookings} completed
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-border/50 bg-card/50 p-3.5 space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Services Listed</span>
                <Wrench className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-foreground">
                  {performance.totalServices}
                </span>
                <span className="text-xs text-indigo-400 font-semibold">
                  {performance.activeServices} active
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-border/50 bg-card/50 p-3.5 space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Total Earnings</span>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-foreground">
                  ₹{performance.totalRevenue.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-muted-foreground">fulfilled</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-xl h-11 p-1 bg-muted/60 rounded-xl border border-border/50">
          <TabsTrigger value="overview" className="rounded-lg text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="services" className="rounded-lg text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            Services ({services.length})
          </TabsTrigger>
          <TabsTrigger value="edit" className="rounded-lg text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            Edit Profile
          </TabsTrigger>
          <TabsTrigger value="account" className="rounded-lg text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            Account & Role
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview & Performance Summary */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Performance Summary & Ratings */}
            <div className="lg:col-span-2 space-y-6">
              {/* Service Performance Card */}
              <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-indigo-500" />
                    <span>Service Performance Summary</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Comprehensive metrics across your campus service operations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Fulfillment Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl border border-border/50 bg-background/50 space-y-1">
                      <span className="text-[11px] text-muted-foreground">Fulfillment Rate</span>
                      <p className="text-lg font-bold text-foreground">{performance.completionRate}%</p>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full"
                          style={{ width: `${performance.completionRate}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-border/50 bg-background/50 space-y-1">
                      <span className="text-[11px] text-muted-foreground">Active Work Orders</span>
                      <p className="text-lg font-bold text-indigo-400">{performance.inProgressBookings}</p>
                      <span className="text-[10px] text-muted-foreground">In progress</span>
                    </div>

                    <div className="p-3 rounded-xl border border-border/50 bg-background/50 space-y-1">
                      <span className="text-[11px] text-muted-foreground">Pending Approval</span>
                      <p className="text-lg font-bold text-amber-400">{performance.pendingBookings}</p>
                      <span className="text-[10px] text-muted-foreground">Awaiting review</span>
                    </div>

                    <div className="p-3 rounded-xl border border-border/50 bg-background/50 space-y-1">
                      <span className="text-[11px] text-muted-foreground">Cancellations</span>
                      <p className="text-lg font-bold text-muted-foreground">{performance.cancelledBookings}</p>
                      <span className="text-[10px] text-muted-foreground">Released slots</span>
                    </div>
                  </div>

                  {/* Rating Breakdown Section */}
                  <div className="p-4 rounded-xl border border-border/50 bg-background/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span>Rating Distribution ({performance.totalReviews} Total Reviews)</span>
                      </h4>
                      <span className="text-xs font-semibold text-primary">
                        {performance.overallAverageRating > 0 ? `${performance.overallAverageRating} / 5.0` : 'No reviews yet'}
                      </span>
                    </div>

                    <div className="space-y-2 pt-1">
                      {[
                        { stars: '5 Stars', count: performance.ratingBreakdown.fiveStar },
                        { stars: '4 Stars', count: performance.ratingBreakdown.fourStar },
                        { stars: '3 Stars', count: performance.ratingBreakdown.threeStar },
                        { stars: '2 Stars', count: performance.ratingBreakdown.twoStar },
                        { stars: '1 Star', count: performance.ratingBreakdown.oneStar },
                      ].map((item) => {
                        const pct =
                          performance.totalReviews > 0
                            ? Math.round((item.count / performance.totalReviews) * 100)
                            : 0;
                        return (
                          <div key={item.stars} className="flex items-center gap-3 text-xs">
                            <span className="w-16 text-[11px] text-muted-foreground">{item.stars}</span>
                            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-amber-400 h-2 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-12 text-right text-[11px] font-mono text-muted-foreground">
                              {item.count} ({pct}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Reviews List */}
              <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div className="space-y-0.5">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                      <span>Recent Student Reviews & Feedback</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Verified student feedback received on your campus services.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {recentReviews.length} Reviews
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentReviews.length === 0 ? (
                    <div className="text-center py-8 space-y-2">
                      <Star className="h-8 w-8 mx-auto text-muted-foreground/40" />
                      <p className="text-xs text-muted-foreground">
                        No reviews received yet. As students complete bookings, their verified ratings and reviews will appear here.
                      </p>
                    </div>
                  ) : (
                    recentReviews.slice(0, 5).map((rev) => (
                      <div
                        key={rev.id}
                        className="p-3.5 rounded-xl border border-border/50 bg-background/50 space-y-2 transition-colors hover:border-indigo-500/30"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-bold text-white">
                              {rev.studentName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-foreground leading-tight">
                                {rev.studentName}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                on <span className="font-semibold text-foreground/80">{rev.serviceName}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center text-amber-400">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < rev.rating
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-muted-foreground/30'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] text-muted-foreground">{rev.formattedDate}</span>
                          </div>
                        </div>

                        {rev.comment && (
                          <p className="text-xs text-foreground/90 italic pl-9">
                            &ldquo;{rev.comment}&rdquo;
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right 1 Col: Business Profile Details & Location Card */}
            <div className="space-y-6">
              <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-indigo-400" />
                    <span>Business Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-[11px]">Store / Desk Name</span>
                    <p className="font-semibold text-foreground">{prefs.businessName}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground text-[11px]">Campus Location</span>
                    <p className="font-semibold text-foreground flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                      <span>{prefs.campusLocation}</span>
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground text-[11px]">Operating Hours</span>
                    <p className="font-semibold text-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                      <span>{prefs.operatingHours}</span>
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground text-[11px]">Emergency Support Phone</span>
                    <p className="font-semibold text-foreground flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                      <span>{prefs.emergencyContact}</span>
                    </p>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-border/50">
                    <span className="text-muted-foreground text-[11px]">About / Service Bio</span>
                    <p className="text-muted-foreground leading-relaxed text-[11px]">
                      {prefs.businessBio}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('edit')}
                    className="w-full text-xs gap-1.5"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit Business Coordinates</span>
                  </Button>
                </CardFooter>
              </Card>

              {/* Quick Actions Card */}
              <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-primary" />
                    <span>Quick Management</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/provider/services/new" className="block">
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
                      <Plus className="h-3.5 w-3.5 text-primary" />
                      <span>Create New Service</span>
                    </Button>
                  </Link>
                  <Link href="/provider/availability" className="block">
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <span>Manage Work Shifts & Availability</span>
                    </Button>
                  </Link>
                  <Link href="/provider/bookings" className="block">
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
                      <Inbox className="h-3.5 w-3.5 text-primary" />
                      <span>View Orders Queue ({performance.pendingBookings} pending)</span>
                    </Button>
                  </Link>
                  <Link href="/provider/dashboard" className="block">
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                      <span>Open Operations Desk</span>
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Services Listed */}
        <TabsContent value="services" className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-foreground">
                Services Offered ({services.length})
              </h3>
              <p className="text-xs text-muted-foreground">
                All campus amenities, equipment, and services configured under your provider desk.
              </p>
            </div>
            <Link href="/provider/services/new">
              <Button size="sm" variant="gradient" className="gap-1.5 text-xs font-semibold shadow-md shadow-indigo-500/20">
                <Plus className="h-3.5 w-3.5" />
                <span>Create New Service</span>
              </Button>
            </Link>
          </div>

          {services.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-border/80 bg-card/40">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 mx-auto mb-3">
                <Wrench className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-foreground">No Services Listed Yet</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                You have not listed any campus services yet. Start by creating laundry, canteen, or IT facility services for students.
              </p>
              <Link href="/provider/services/new">
                <Button size="sm" variant="gradient" className="gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  <span>List Your First Service</span>
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((svc) => (
                <Card
                  key={svc.id}
                  className="relative flex flex-col justify-between overflow-hidden border-border/60 bg-card/60 backdrop-blur-xl hover:border-indigo-500/40 transition-all hover:shadow-lg hover:shadow-indigo-500/5"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <Badge variant="outline" className="text-[10px] font-semibold">
                        {svc.category}
                      </Badge>
                      <Badge
                        variant={svc.isActive ? 'success' : 'secondary'}
                        className="text-[10px] font-semibold"
                      >
                        {svc.isActive ? 'Active' : 'Paused'}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-bold line-clamp-1">
                      {svc.name}
                    </CardTitle>
                    {svc.location && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 line-clamp-1">
                        <MapPin className="h-3 w-3 text-indigo-400 shrink-0" />
                        <span>{svc.location}</span>
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-3 pb-3">
                    <div className="grid grid-cols-2 gap-2 text-xs py-2 px-3 rounded-lg bg-background/50 border border-border/40">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Price</span>
                        <span className="font-bold text-foreground">
                          {svc.price === 0 ? 'Free' : `₹${svc.price}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Duration</span>
                        <span className="font-semibold text-foreground">
                          {svc.durationMinutes} mins
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Inbox className="h-3.5 w-3.5 text-blue-500" />
                        <span>{svc.totalBookings} bookings</span>
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-foreground">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span>{svc.averageRating > 0 ? svc.averageRating : '5.0'}</span>
                        <span className="text-[10px] text-muted-foreground">({svc.totalReviews})</span>
                      </span>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-2 border-t border-border/40 gap-2">
                    <Link href={`/provider/services/${svc.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs gap-1">
                        <Edit3 className="h-3 w-3" />
                        <span>Edit</span>
                      </Button>
                    </Link>
                    <Link href={`/provider/availability`} className="flex-1">
                      <Button variant="ghost" size="sm" className="w-full text-xs gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Schedule</span>
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Editable Provider Profile Form */}
        <TabsContent value="edit" className="space-y-6">
          <Card className="border-border/60 bg-card/60 backdrop-blur-xl max-w-3xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Edit3 className="h-4 w-4 text-indigo-400" />
                    <span>Provider Profile Information</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Update your business coordinates, contact details, and campus desk operations.
                  </CardDescription>
                </div>
                <Badge variant="glow" className="text-[10px] bg-indigo-500/10 text-indigo-400 border-indigo-500/30">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Self-Service Only
                </Badge>
              </div>
            </CardHeader>

            <form onSubmit={handleSaveProfile}>
              <CardContent className="space-y-5">
                {/* Security and ownership notice */}
                <div className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-xs text-indigo-300 flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-indigo-400 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground">Ownership Guarantee: </span>
                    <span>You can only modify your own service provider information. Authentication, password changes, and multi-factor security remain exclusively delegated to Clerk.</span>
                  </div>
                </div>

                {/* Database Persisted Fields */}
                <div className="space-y-4 pt-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Core Contact Coordinates (Saved to Database)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Provider / Contact Person Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Sunil Kumar"
                        className="w-full rounded-xl border border-border/80 bg-background/80 px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Contact Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full rounded-xl border border-border/80 bg-background/80 px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                      />
                      <span className="text-[10px] text-muted-foreground block">
                        Students receive this number upon booking confirmation for pickup or questions.
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Primary Campus Email (Read-Only)
                    </label>
                    <input
                      type="email"
                      readOnly
                      disabled
                      value={displayEmail}
                      className="w-full rounded-xl border border-border/40 bg-muted/40 px-3.5 py-2 text-xs text-muted-foreground cursor-not-allowed"
                    />
                    <span className="text-[10px] text-muted-foreground block">
                      Synced from Clerk. To update your campus email, open Clerk Security Settings.
                    </span>
                  </div>
                </div>

                {/* Application-Specific Provider Profile Fields */}
                <div className="space-y-4 pt-4 border-t border-border/60">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Campus Business & Operations Configuration
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Business / Store Name
                      </label>
                      <input
                        type="text"
                        value={prefs.businessName}
                        onChange={(e) => setPrefs({ ...prefs, businessName: e.target.value })}
                        placeholder="e.g. Campus Quick Clean Laundry"
                        className="w-full rounded-xl border border-border/80 bg-background/80 px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Physical Campus Location
                      </label>
                      <input
                        type="text"
                        value={prefs.campusLocation}
                        onChange={(e) => setPrefs({ ...prefs, campusLocation: e.target.value })}
                        placeholder="e.g. SAC Building Ground Floor Room 102"
                        className="w-full rounded-xl border border-border/80 bg-background/80 px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Operating Hours & Days
                      </label>
                      <input
                        type="text"
                        value={prefs.operatingHours}
                        onChange={(e) => setPrefs({ ...prefs, operatingHours: e.target.value })}
                        placeholder="e.g. Mon - Sat: 08:30 AM - 07:00 PM"
                        className="w-full rounded-xl border border-border/80 bg-background/80 px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Emergency Support Line
                      </label>
                      <input
                        type="tel"
                        value={prefs.emergencyContact}
                        onChange={(e) => setPrefs({ ...prefs, emergencyContact: e.target.value })}
                        placeholder="e.g. +91 99887 76655"
                        className="w-full rounded-xl border border-border/80 bg-background/80 px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Business Bio & Facility Overview
                    </label>
                    <textarea
                      rows={3}
                      value={prefs.businessBio}
                      onChange={(e) => setPrefs({ ...prefs, businessBio: e.target.value })}
                      placeholder="Describe your services, hygiene standards, processing time, and equipment..."
                      className="w-full rounded-xl border border-border/80 bg-background/80 px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Payout & Settlements UPI ID
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        value={prefs.payoutUpi}
                        onChange={(e) => setPrefs({ ...prefs, payoutUpi: e.target.value })}
                        placeholder="e.g. campusserve.vendor@upi"
                        className="w-full rounded-xl border border-border/80 bg-background/80 pl-9 pr-3.5 py-2 text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground block">
                      Weekly automated payout reconciliation is dispatched to this VPA.
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between border-t border-border/60 pt-4">
                <span className="text-[11px] text-muted-foreground">
                  Changes take effect immediately on your customer-facing desk.
                </span>
                <Button
                  type="submit"
                  disabled={isSaving}
                  variant="gradient"
                  className="gap-2 text-xs font-semibold shadow-md shadow-indigo-500/20"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Tab 4: Account Information & Role Switching */}
        <TabsContent value="account" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Account Details Card */}
            <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Account & Identity Information</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Your campus identity and cryptographic verification record.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-border/40">
                  <span className="text-muted-foreground">Current Account Role</span>
                  <Badge variant="glow" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30 text-[10px]">
                    SERVICE_PROVIDER
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/40">
                  <span className="text-muted-foreground">Provider Database ID</span>
                  <span className="font-mono text-[11px] text-foreground">{initialData.id}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/40">
                  <span className="text-muted-foreground">Clerk User ID</span>
                  <span className="font-mono text-[11px] text-foreground">{initialData.clerkUserId}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/40">
                  <span className="text-muted-foreground">Registration Timestamp</span>
                  <span className="text-foreground">{initialData.formattedJoinedDate}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Authentication Provider</span>
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Clerk Identity (RS256)</span>
                  </span>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (openUserProfile) {
                      openUserProfile();
                    } else {
                      router.push('/profile');
                    }
                  }}
                  className="w-full text-xs gap-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Manage Passwords & Sessions via Clerk</span>
                </Button>
              </CardFooter>
            </Card>

            {/* Role Switcher Card */}
            <Card className="border-border/60 bg-card/60 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>Switch Account Perspective</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Seamlessly toggle between Service Provider and Student roles on the same campus login.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-300 space-y-1.5">
                  <div className="font-semibold flex items-center gap-1.5 text-foreground">
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>Need to book campus facilities for yourself?</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    You can switch your perspective to <strong>Student</strong> to browse campus amenities, reserve hostel laundry, or purchase canteen tokens. Your provider services and historical bookings will remain preserved.
                  </p>
                </div>

                <div className="space-y-2 text-muted-foreground text-[11px]">
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>No data loss: services and review histories are safely retained.</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>You can switch back to Service Provider anytime from your profile.</span>
                  </p>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={handleOpenSwitchRoleModal}
                  className="w-full text-xs font-semibold gap-1.5 shadow-md shadow-indigo-500/20"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Switch Role to Student</span>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog for Role Switching */}
      <Dialog open={isSwitchRoleModalOpen} onOpenChange={setIsSwitchRoleModalOpen}>
        <DialogContent className="max-w-md rounded-2xl border-border bg-card p-6 shadow-2xl">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2 text-amber-500">
              <HelpCircle className="h-5 w-5" />
              <DialogTitle className="text-lg font-bold">
                Switch Role to Student?
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Confirming this will switch your active perspective in PostgreSQL from{' '}
              <strong className="text-foreground">Service Provider</strong> to{' '}
              <strong className="text-foreground">Student</strong>.
            </DialogDescription>
          </DialogHeader>

          {isCheckingObligations ? (
            <div className="py-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Verifying active work orders...</span>
            </div>
          ) : (
            <div className="space-y-3 my-2 text-xs">
              {activeObligationsCount > 0 ? (
                <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Active Bookings Notice</span>
                  </div>
                  <p className="text-[11px] text-foreground/90">
                    You currently have <strong className="text-amber-300">{activeObligationsCount}</strong> active/pending booking requests. Switching to Student role will not cancel them, but remember to switch back to fulfill customer obligations.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Clean Queue</span>
                  </div>
                  <p className="text-[11px] text-foreground/90">
                    You have 0 pending work orders. It is completely safe to switch to Student perspective.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isSwitchingRole}
              onClick={() => setIsSwitchRoleModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              size="sm"
              disabled={isSwitchingRole || isCheckingObligations}
              onClick={handleConfirmSwitchToStudent}
              className="gap-1.5 text-xs font-semibold shadow-md shadow-indigo-500/20"
            >
              {isSwitchingRole ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Switching to Student...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Confirm & Switch Role</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
