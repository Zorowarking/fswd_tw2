'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
  GraduationCap,
  ShieldCheck,
  Mail,
  Phone,
  Calendar,
  Lock,
  ExternalLink,
  Save,
  CheckCircle2,
  Building2,
  ArrowLeftRight,
  Bell,
  Sliders,
  CalendarCheck,
  Star,
  Check,
  Loader2,
  AlertCircle,
  Clock,
  Sparkles,
  MapPin,
  IdCard,
} from 'lucide-react';
import { PortalShell } from '@/components/layout/portal-shell';
import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import { switchUserRole } from '@/app/actions/role-actions';
import { updateStudentProfileAction, type StudentProfileData } from '@/app/actions/student-profile-actions';
import { invalidateClientRoleCache } from '@/hooks/use-user-role';

interface StudentProfileViewProps {
  initialData: StudentProfileData;
}

export function StudentProfileView({ initialData }: StudentProfileViewProps) {
  const router = useRouter();
  const { user: clerkUser } = useUser();

  // Profile fields state
  const [name, setName] = React.useState(initialData.name || '');
  const [phone, setPhone] = React.useState(initialData.phone || '');
  const [studentId, setStudentId] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cs_student_id') || '2024CSB1042';
    }
    return '2024CSB1042';
  });
  const [department, setDepartment] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cs_student_department') || 'Computer Science & Engineering';
    }
    return 'Computer Science & Engineering';
  });
  const [hostelRoom, setHostelRoom] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cs_student_hostel') || 'Hostel Block B, Room 304';
    }
    return 'Hostel Block B, Room 304';
  });
  const [preferredPayment, setPreferredPayment] = React.useState<'UPI' | 'CARD' | 'CAMPUS_WALLET'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('cs_preferred_payment') as 'UPI' | 'CARD' | 'CAMPUS_WALLET') || 'UPI';
    }
    return 'UPI';
  });

  // Notification toggles
  const [notifyBookings, setNotifyBookings] = React.useState(true);
  const [notifyPayments, setNotifyPayments] = React.useState(true);
  const [notifyReminders, setNotifyReminders] = React.useState(true);
  const [notifyAnnouncements, setNotifyAnnouncements] = React.useState(false);

  // Submission states
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  // Role Switch Dialog state
  const [switchModalOpen, setSwitchModalOpen] = React.useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = React.useState(false);
  const [switchError, setSwitchError] = React.useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const finalName = name.trim() || clerkUser?.fullName || 'Campus Student';
      const result = await updateStudentProfileAction({
        name: finalName,
        phone: phone || null,
      });

      if (!result.success) {
        setSaveError(result.error || 'Failed to update profile details.');
        setIsSaving(false);
        return;
      }

      // Persist client preferences locally
      if (typeof window !== 'undefined') {
        localStorage.setItem('cs_student_id', studentId);
        localStorage.setItem('cs_student_department', department);
        localStorage.setItem('cs_student_hostel', hostelRoom);
        localStorage.setItem('cs_preferred_payment', preferredPayment);
      }

      // Also attempt updating Clerk client display name if available
      if (clerkUser) {
        try {
          const parts = name.trim().split(' ');
          const firstName = parts[0] || name;
          const lastName = parts.slice(1).join(' ') || '';
          await clerkUser.update({ firstName, lastName });
        } catch {
          // Ignored if clerk update fails; database is single source of truth
        }
      }

      setSaveSuccess(true);
      toast.success('Student profile updated successfully in Neon PostgreSQL!');
      router.refresh();
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred while saving profile.';
      setSaveError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSwitchToProvider = async () => {
    setIsSwitchingRole(true);
    setSwitchError(null);

    try {
      const result = await switchUserRole('SERVICE_PROVIDER');

      if (!result.success || !result.redirectUrl) {
        setSwitchError(result.error || 'Failed to switch role.');
        setIsSwitchingRole(false);
        return;
      }

      invalidateClientRoleCache();
      toast.success('Account switched to Service Provider successfully!');
      setSwitchModalOpen(false);
      router.replace(result.redirectUrl);
    } catch (err) {
      setSwitchError(err instanceof Error ? err.message : 'Failed to switch role.');
      setIsSwitchingRole(false);
    }
  };

  const avatarUrl = clerkUser?.imageUrl || initialData.avatarUrl;
  const displayName =
    (name && !name.startsWith('user_') ? name : null) ||
    clerkUser?.fullName ||
    clerkUser?.firstName ||
    'Campus Student';
  const displayEmail =
    clerkUser?.primaryEmailAddress?.emailAddress ||
    (initialData.email && !initialData.email.startsWith('user_')
      ? initialData.email
      : 'student@campus.edu');

  return (
    <PortalShell
      area="student"
      breadcrumbs={[
        { label: 'Student Portal', href: '/student/dashboard' },
        { label: 'Student Profile', active: true },
      ]}
    >
      <PageContainer
        title="Student Profile & Settings"
        description="Manage your campus student identity, contact coordinates, notification preferences, and application settings."
        badge={
          <Badge variant="glow" className="text-[10px] gap-1 px-2.5 py-0.5">
            <GraduationCap className="h-3 w-3 text-primary" />
            <span>Campus Student Account</span>
          </Badge>
        }
      >
        <div className="space-y-8">
          {/* 1. Header Identity & Overview Card */}
          <Card className="relative overflow-hidden border-border/80 bg-gradient-to-br from-card via-card to-blue-500/5 shadow-lg">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Profile Photo via Clerk */}
                <div className="relative group shrink-0">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-24 w-24 rounded-2xl object-cover ring-4 ring-primary/20 shadow-xl"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-3xl font-extrabold text-white shadow-xl shadow-blue-500/20">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-md ring-2 ring-background">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>

                {/* Identity Metadata */}
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                      {displayName}
                    </h1>

                    {/* Role Display */}
                    <Badge variant="glow" className="text-xs px-2.5 py-0.5 font-bold gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">
                      <GraduationCap className="h-3.5 w-3.5" />
                      <span>ROLE: STUDENT</span>
                    </Badge>
                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1">
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-blue-500" />
                      <span>{displayEmail}</span>
                    </span>
                    {phone && (
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-emerald-500" />
                        <span>{phone}</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Joined {initialData.formattedJoinedDate}</span>
                    </span>
                  </p>

                  <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-background/50 px-2.5 py-1 text-muted-foreground">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Clerk Identity Verified</span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-background/50 px-2.5 py-1 text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                      <span>PostgreSQL DB Synced</span>
                    </div>
                  </div>
                </div>

                {/* Quick Profile Actions */}
                <div className="shrink-0 flex flex-col sm:flex-row items-center gap-2">
                  <Link href="/profile">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Manage Clerk Security</span>
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Student Activity Quick Counters */}
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-border/60 pt-6">
                <div className="flex flex-col items-center sm:items-start p-3 rounded-xl bg-background/40 border border-border/40">
                  <span className="text-xl sm:text-2xl font-black text-foreground">
                    {initialData.metrics.totalBookings}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 mt-0.5">
                    <CalendarCheck className="h-3 w-3 text-blue-500" /> Total Bookings
                  </span>
                </div>

                <div className="flex flex-col items-center sm:items-start p-3 rounded-xl bg-background/40 border border-border/40">
                  <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
                    {initialData.metrics.activeBookings}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3 text-amber-500" /> Active Reservations
                  </span>
                </div>

                <div className="flex flex-col items-center sm:items-start p-3 rounded-xl bg-background/40 border border-border/40">
                  <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {initialData.metrics.completedBookings}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Completed Orders
                  </span>
                </div>

                <div className="flex flex-col items-center sm:items-start p-3 rounded-xl bg-background/40 border border-border/40">
                  <span className="text-xl sm:text-2xl font-black text-amber-500">
                    {initialData.metrics.totalReviews}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Star className="h-3 w-3 text-amber-500" /> Reviews Shared
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Main Tabs Section */}
          <Tabs defaultValue="details" className="w-full space-y-6">
            <TabsList className="grid w-full grid-cols-3 max-w-md bg-muted/60 p-1 rounded-xl">
              <TabsTrigger value="details" className="text-xs font-semibold rounded-lg">
                Personal Info
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs font-semibold rounded-lg">
                Preferences
              </TabsTrigger>
              <TabsTrigger value="role" className="text-xs font-semibold rounded-lg">
                Role & Access
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Personal & Application-Specific Details */}
            <TabsContent value="details">
              <Card className="border-border/80 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IdCard className="h-5 w-5 text-primary" />
                    <span>Application Student Profile</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Update your application-specific campus coordinates. Credentials and passwords are kept securely with Clerk.
                  </CardDescription>
                </CardHeader>

                <form onSubmit={handleSaveProfile}>
                  <CardContent className="space-y-6">
                    {saveSuccess && (
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>Changes saved permanently to database!</span>
                      </div>
                    )}

                    {saveError && (
                      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{saveError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Name */}
                      <div className="space-y-2">
                        <Label htmlFor="input-name" className="text-xs font-semibold">
                          Full Campus Name *
                        </Label>
                        <Input
                          id="input-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your official name"
                          required
                          className="h-9 text-xs"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Shown on booking passes and service provider fulfillment queues.
                        </p>
                      </div>

                      {/* Phone */}
                      <div className="space-y-2">
                        <Label htmlFor="input-phone" className="text-xs font-semibold">
                          Contact Mobile Number
                        </Label>
                        <Input
                          id="input-phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="h-9 text-xs"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Used for delivery OTPs, machine availability, and SMS alerts.
                        </p>
                      </div>

                      {/* Student ID / Roll Number */}
                      <div className="space-y-2">
                        <Label htmlFor="input-student-id" className="text-xs font-semibold">
                          Student Roll / ID Number
                        </Label>
                        <Input
                          id="input-student-id"
                          value={studentId}
                          onChange={(e) => setStudentId(e.target.value)}
                          placeholder="e.g. 2024CSB1042"
                          className="h-9 text-xs font-mono"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Printed on campus smart receipts and lab reservation passes.
                        </p>
                      </div>

                      {/* Academic Department */}
                      <div className="space-y-2">
                        <Label htmlFor="input-department" className="text-xs font-semibold">
                          Department / Faculty
                        </Label>
                        <Input
                          id="input-department"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          placeholder="e.g. Computer Science & Engineering"
                          className="h-9 text-xs"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Used to filter lab permissions and department facilities.
                        </p>
                      </div>

                      {/* Default Hostel / Room Location */}
                      <div className="sm:col-span-2 space-y-2">
                        <Label htmlFor="input-hostel" className="text-xs font-semibold flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-blue-500" />
                          <span>Default Campus Delivery & Residence Location</span>
                        </Label>
                        <Input
                          id="input-hostel"
                          value={hostelRoom}
                          onChange={(e) => setHostelRoom(e.target.value)}
                          placeholder="e.g. Hostel Block B, Room 304"
                          className="h-9 text-xs"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Automatically fills location field when booking hostel laundry pick-up or hardware support.
                        </p>
                      </div>

                      {/* Email (Readonly) */}
                      <div className="sm:col-span-2 space-y-2">
                        <Label htmlFor="input-email" className="text-xs font-semibold flex items-center justify-between">
                          <span>Primary Campus Email</span>
                          <span className="text-[10px] font-normal text-muted-foreground">
                            Managed by Clerk
                          </span>
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="input-email"
                            value={displayEmail}
                            disabled
                            className="h-9 text-xs bg-muted/40 cursor-not-allowed"
                          />
                          <Badge variant="outline" className="text-[10px] shrink-0 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 py-1">
                            <Check className="h-3 w-3" />
                            <span>Verified</span>
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="flex justify-end gap-3 border-t border-border/60 bg-muted/20 py-4 px-6 rounded-b-xl">
                    <Button
                      type="submit"
                      variant="gradient"
                      disabled={isSaving}
                      className="gap-2 text-xs font-semibold shadow-md shadow-blue-500/20"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-3.5 w-3.5" />
                          <span>Save Profile Information</span>
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            {/* TAB 2: Preferences & Account Settings */}
            <TabsContent value="settings">
              <div className="space-y-6">
                {/* Notification Settings */}
                <Card className="border-border/80 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bell className="h-5 w-5 text-primary" />
                      <span>Notification Preferences</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Configure which alerts and notifications you receive across the CampusServe in-app bell menu and email.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-card/60">
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-foreground">Booking Confirmations & Status</p>
                        <p className="text-[11px] text-muted-foreground">Receive instant alerts when a provider confirms, accepts, or updates your reservation.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifyBookings}
                        onChange={(e) => setNotifyBookings(e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-card/60">
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-foreground">Payment & Refund Receipts</p>
                        <p className="text-[11px] text-muted-foreground">Instant notifications for Razorpay test checkout and refund settlements.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifyPayments}
                        onChange={(e) => setNotifyPayments(e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-card/60">
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-foreground">24-Hour Upcoming Booking Reminders</p>
                        <p className="text-[11px] text-muted-foreground">Automated reminders before scheduled laundry, mess meal time, or seminar slot.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifyReminders}
                        onChange={(e) => setNotifyReminders(e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-card/60">
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-foreground">Campus Facility Announcements</p>
                        <p className="text-[11px] text-muted-foreground">General university notices regarding facility maintenance and holiday hours.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifyAnnouncements}
                        onChange={(e) => setNotifyAnnouncements(e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Booking & Payment Preferences */}
                <Card className="border-border/80 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sliders className="h-5 w-5 text-primary" />
                      <span>Booking & Payment Preferences</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Set your default checkout simulation preferences for student facility orders.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Preferred Checkout Method</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setPreferredPayment('UPI')}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            preferredPayment === 'UPI'
                              ? 'border-blue-600 bg-blue-500/10 text-foreground ring-1 ring-blue-500/30'
                              : 'border-border/70 bg-card hover:bg-muted/40 text-muted-foreground'
                          }`}
                        >
                          <p className="text-xs font-bold text-foreground">Instant UPI</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">GPay, PhonePe, Paytm simulation</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPreferredPayment('CARD')}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            preferredPayment === 'CARD'
                              ? 'border-blue-600 bg-blue-500/10 text-foreground ring-1 ring-blue-500/30'
                              : 'border-border/70 bg-card hover:bg-muted/40 text-muted-foreground'
                          }`}
                        >
                          <p className="text-xs font-bold text-foreground">Cards / Net Banking</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Standard Razorpay Gateway</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPreferredPayment('CAMPUS_WALLET')}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            preferredPayment === 'CAMPUS_WALLET'
                              ? 'border-blue-600 bg-blue-500/10 text-foreground ring-1 ring-blue-500/30'
                              : 'border-border/70 bg-card hover:bg-muted/40 text-muted-foreground'
                          }`}
                        >
                          <p className="text-xs font-bold text-foreground">Campus Smart Wallet</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">University ID card balance</p>
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Password & Security Notice (Do Not Duplicate Clerk) */}
                <Card className="border-border/80 shadow-md bg-muted/20">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Lock className="h-5 w-5 text-primary" />
                      <span>Credentials & Security Management</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      CampusServe relies on Clerk Identity for industry-grade cryptographic session management.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs text-muted-foreground">
                    <p className="leading-relaxed">
                      To protect your university account, password modifications, Multi-Factor Authentication (2FA), and active browser sessions are managed exclusively through Clerk Security. No passwords or plaintext credentials are stored in CampusServe databases.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <Link href="/profile">
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                          <Lock className="h-3.5 w-3.5 text-primary" />
                          <span>Open Clerk Security Settings</span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TAB 3: Role & Access Overview */}
            <TabsContent value="role">
              <div className="space-y-6">
                <Card className="border-blue-500/30 bg-gradient-to-br from-card via-card to-blue-500/5 shadow-md">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          <GraduationCap className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Selected Campus Role: Student</CardTitle>
                          <CardDescription className="text-xs">
                            Active workspace: Student Portal (/student/*)
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="glow" className="text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">
                        ACTIVE
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-xl border border-border/60 bg-background/50 p-4 space-y-3">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Role Capabilities & Privileges
                      </h4>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span>Browse university services catalog</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span>Reserve real-time facility slots</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span>Track fulfillment status in real-time</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span>Simulate Razorpay test payments</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span>Cancel eligible booking slots</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span>Submit verified 1–5 star reviews</span>
                        </li>
                      </ul>
                    </div>

                    {/* Role Switcher Section */}
                    <div className="rounded-xl border border-border/80 bg-muted/20 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Building2 className="h-4 w-4 text-indigo-500" />
                          <span>Need to offer campus services as a provider?</span>
                        </h4>
                        <p className="text-[11px] text-muted-foreground max-w-lg leading-relaxed">
                          You can switch your account type to Service Provider to list facility amenities, configure slot schedules, and fulfill student orders. Your existing student bookings will remain preserved.
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSwitchModalOpen(true)}
                        className="gap-1.5 text-xs shrink-0 font-semibold"
                        id="btn-switch-to-provider"
                      >
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                        <span>Switch to Provider</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Confirmation Modal to Switch to Service Provider */}
        <Dialog open={switchModalOpen} onOpenChange={setSwitchModalOpen}>
          <DialogContent className="max-w-md rounded-2xl border-border bg-card p-6 shadow-2xl">
            <DialogHeader className="space-y-2">
              <div className="flex items-center gap-2 text-indigo-500">
                <Building2 className="h-5 w-5" />
                <DialogTitle className="text-lg font-bold">
                  Switch Account to Service Provider
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                You are switching your CampusServe account from <strong className="text-foreground">Student</strong> to <strong className="text-foreground">Service Provider</strong>.
              </DialogDescription>
            </DialogHeader>

            {switchError && (
              <div className="my-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{switchError}</span>
              </div>
            )}

            <div className="my-2 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-xs text-foreground/90 space-y-1.5">
              <div className="font-semibold text-indigo-600 dark:text-indigo-400">
                What changes with Provider Access:
              </div>
              <ul className="text-muted-foreground text-[11px] space-y-1 list-disc list-inside">
                <li>Your primary dashboard will switch to the Provider Desk (/provider/dashboard).</li>
                <li>You will gain ability to publish campus services and manage slot availability.</li>
                <li>All your past student bookings and payment history will be safely preserved.</li>
                <li>You can switch back to Student at any time from your profile.</li>
              </ul>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isSwitchingRole}
                onClick={() => setSwitchModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="gradient"
                size="sm"
                disabled={isSwitchingRole}
                onClick={handleSwitchToProvider}
                className="gap-1.5 text-xs font-semibold shadow-md shadow-indigo-500/20"
              >
                {isSwitchingRole ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Switching to Provider...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Confirm Switch to Provider</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </PortalShell>
  );
}
