'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import {
  GraduationCap,
  Building2,
  Check,
  Search,
  CalendarCheck,
  CreditCard,
  MapPin,
  MessageSquare,
  Wrench,
  Clock,
  ClipboardList,
  TrendingUp,
  Star,
  ArrowRight,
  ShieldCheck,
  Loader2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { selectUserRole } from '@/app/actions/role-actions';
import { invalidateClientRoleCache, useUserRole } from '@/hooks/use-user-role';

type RoleType = 'STUDENT' | 'SERVICE_PROVIDER';

export function RoleSelectionView() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { role: existingRole } = useUserRole();

  const [selectedRole, setSelectedRole] = React.useState<RoleType | null>(null);
  const [confirmModalRole, setConfirmModalRole] = React.useState<RoleType | null>(null);
  const [submittingRole, setSubmittingRole] = React.useState<RoleType | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // If user already has an assigned role, lock them out of /select-role and push to their dashboard
  React.useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace('/sign-in?redirect_url=/select-role');
      return;
    }
    if (existingRole) {
      const dest =
        existingRole === 'STUDENT'
          ? '/student/dashboard'
          : existingRole === 'SERVICE_PROVIDER'
          ? '/provider/dashboard'
          : '/admin/dashboard';
      router.replace(dest);
    }
  }, [isLoaded, isSignedIn, existingRole, router]);

  // Initiates explicit confirmation dialog
  const handleOpenConfirmDialog = (role: RoleType) => {
    setSelectedRole(role);
    setConfirmModalRole(role);
    setErrorMessage(null);
  };

  // User explicitly confirms selection inside dialog
  const handleConfirmAndProceed = async () => {
    if (!confirmModalRole) return;

    const roleToAssign = confirmModalRole;
    setSubmittingRole(roleToAssign);
    setErrorMessage(null);

    try {
      const clientData = {
        clerkUserId: user?.id,
        email:
          user?.primaryEmailAddress?.emailAddress ||
          user?.emailAddresses?.[0]?.emailAddress ||
          undefined,
        name:
          user?.fullName ||
          [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
          undefined,
      };

      const result = await selectUserRole(roleToAssign, clientData);

      if (!result.success || !result.redirectUrl) {
        setErrorMessage(result.error || 'Failed to save role to database. Please try again.');
        setSubmittingRole(null);
        setConfirmModalRole(null);
        return;
      }

      // Invalidate client cache and navigate directly to role dashboard
      invalidateClientRoleCache();
      setConfirmModalRole(null);
      router.replace(result.redirectUrl);
      router.refresh();
    } catch (err: unknown) {
      console.error('[Role Selection Submit Error]:', err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'A network or system error occurred. Please try again.'
      );
      setSubmittingRole(null);
      setConfirmModalRole(null);
    }
  };

  const isSubmitting = submittingRole !== null;

  if (isLoaded && existingRole) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-3 p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground animate-pulse">
          Campus role already active. Redirecting to your portal...
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-background">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex justify-center overflow-hidden">
        <div className="h-[450px] w-full max-w-5xl bg-gradient-to-b from-blue-500/10 via-indigo-500/5 to-transparent blur-3xl" />
        <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-blue-500/10 blur-[90px]" />
        <div className="absolute top-1/3 right-1/4 h-72 w-72 rounded-full bg-indigo-500/10 blur-[90px]" />
      </div>

      <div className="w-full max-w-4xl space-y-10">
        {/* Onboarding Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            How would you like to use CampusServe?
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Choose your account type to get started with campus services.
          </p>

          <div className="flex items-center justify-center gap-2 pt-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Database-backed role assignment • Stored permanently in PostgreSQL</span>
          </div>
        </div>

        {/* Error notification banner if submission fails */}
        {errorMessage && (
          <div className="max-w-xl mx-auto rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-600 dark:text-red-400 flex items-start gap-3 shadow-md">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Unable to set role: </span>
              {errorMessage}
            </div>
          </div>
        )}

        {/* Exactly TWO Equal Primary Options: Student and Service Provider */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Card 1: STUDENT */}
          <div
            id="role-card-student"
            role="button"
            tabIndex={0}
            onClick={() => {
              if (!isSubmitting) setSelectedRole('STUDENT');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!isSubmitting) setSelectedRole('STUDENT');
              }
            }}
            className={cn(
              'group relative flex flex-col justify-between rounded-2xl border p-7 sm:p-8 transition-all duration-300 cursor-pointer select-none',
              'bg-card/80 backdrop-blur-xl hover:shadow-xl hover:shadow-blue-500/10',
              selectedRole === 'STUDENT'
                ? 'border-blue-600 ring-2 ring-blue-600/30 shadow-lg shadow-blue-500/10 bg-gradient-to-b from-blue-500/5 via-card to-card'
                : 'border-border/80 hover:border-blue-500/40'
            )}
          >
            <div>
              {/* Header with Icon and Selection Indicator */}
              <div className="flex items-center justify-between pb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-200',
                    selectedRole === 'STUDENT'
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-border bg-muted/30 text-transparent group-hover:border-blue-400'
                  )}
                >
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-2 mb-6">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Student
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed min-h-[36px]">
                  Discover campus services, reserve facilities, make payments, track your bookings and share feedback.
                </p>
              </div>

              {/* Bulleted Feature List */}
              <div className="space-y-2.5 pt-4 pb-6 border-t border-border/60">
                <ul className="space-y-2.5 text-xs text-foreground/90">
                  <li className="flex items-center gap-2.5">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Search className="h-3 w-3" />
                    </div>
                    <span>Explore campus services</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <CalendarCheck className="h-3 w-3" />
                    </div>
                    <span>Book campus facilities</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <MapPin className="h-3 w-3" />
                    </div>
                    <span>Track your reservations</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <CreditCard className="h-3 w-3" />
                    </div>
                    <span>Manage payments</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <MessageSquare className="h-3 w-3" />
                    </div>
                    <span>Share feedback</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Action button */}
            <div className="pt-2">
              <Button
                id="btn-continue-student"
                variant={selectedRole === 'STUDENT' ? 'gradient' : 'outline'}
                disabled={isSubmitting}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenConfirmDialog('STUDENT');
                }}
                className="w-full justify-center gap-2 text-xs py-2.5 font-semibold transition-all shadow-sm"
              >
                {submittingRole === 'STUDENT' ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Setting up Student Portal...</span>
                  </>
                ) : (
                  <>
                    <span>Continue as Student</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Card 2: SERVICE PROVIDER */}
          <div
            id="role-card-provider"
            role="button"
            tabIndex={0}
            onClick={() => {
              if (!isSubmitting) setSelectedRole('SERVICE_PROVIDER');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!isSubmitting) setSelectedRole('SERVICE_PROVIDER');
              }
            }}
            className={cn(
              'group relative flex flex-col justify-between rounded-2xl border p-7 sm:p-8 transition-all duration-300 cursor-pointer select-none',
              'bg-card/80 backdrop-blur-xl hover:shadow-xl hover:shadow-blue-500/10',
              selectedRole === 'SERVICE_PROVIDER'
                ? 'border-blue-600 ring-2 ring-blue-600/30 shadow-lg shadow-blue-500/10 bg-gradient-to-b from-blue-500/5 via-card to-card'
                : 'border-border/80 hover:border-blue-500/40'
            )}
          >
            <div>
              {/* Header with Icon and Selection Indicator */}
              <div className="flex items-center justify-between pb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/25">
                  <Building2 className="h-6 w-6" />
                </div>
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-200',
                    selectedRole === 'SERVICE_PROVIDER'
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-border bg-muted/30 text-transparent group-hover:border-blue-400'
                  )}
                >
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-2 mb-6">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Service Provider
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed min-h-[36px]">
                  Offer campus services, manage availability, handle booking requests and monitor your service performance.
                </p>
              </div>

              {/* Bulleted Feature List */}
              <div className="space-y-2.5 pt-4 pb-6 border-t border-border/60">
                <ul className="space-y-2.5 text-xs text-foreground/90">
                  <li className="flex items-center gap-2.5">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Wrench className="h-3 w-3" />
                    </div>
                    <span>Manage your services</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Clock className="h-3 w-3" />
                    </div>
                    <span>Set availability</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <ClipboardList className="h-3 w-3" />
                    </div>
                    <span>Handle bookings</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <TrendingUp className="h-3 w-3" />
                    </div>
                    <span>Track earnings</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Star className="h-3 w-3" />
                    </div>
                    <span>Manage customer feedback</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Action button */}
            <div className="pt-2">
              <Button
                id="btn-continue-provider"
                variant={selectedRole === 'SERVICE_PROVIDER' ? 'gradient' : 'outline'}
                disabled={isSubmitting}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenConfirmDialog('SERVICE_PROVIDER');
                }}
                className="w-full justify-center gap-2 text-xs py-2.5 font-semibold transition-all shadow-sm"
              >
                {submittingRole === 'SERVICE_PROVIDER' ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Setting up Provider Desk...</span>
                  </>
                ) : (
                  <>
                    <span>Continue as Service Provider</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Explicit Confirmation Dialog */}
      <Dialog
        open={confirmModalRole !== null}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) setConfirmModalRole(null);
        }}
      >
        <DialogContent className="max-w-md rounded-2xl border-border bg-card p-6 shadow-2xl">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <HelpCircle className="h-5 w-5" />
              <DialogTitle className="text-lg font-bold">
                Confirm Account Type
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              You are selecting{' '}
              <strong className="text-foreground">
                {confirmModalRole === 'STUDENT' ? 'Student' : 'Service Provider'}
              </strong>
              . This will configure your initial workspace and permissions in Neon PostgreSQL.
            </DialogDescription>
          </DialogHeader>

          <div className="my-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-foreground/90 space-y-1.5">
            <div className="font-semibold text-primary">
              {confirmModalRole === 'STUDENT'
                ? 'Student Workspace Access:'
                : 'Service Provider Desk Access:'}
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              {confirmModalRole === 'STUDENT'
                ? 'You will be able to browse verified university amenities, book slots, complete test payments, and track fulfillment.'
                : 'You will be able to list campus services, establish time slot schedules, manage bookings, and track customer earnings.'}
            </p>
            <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/50">
              Note: You can switch your account type later at any time from your Profile settings.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setConfirmModalRole(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              size="sm"
              disabled={isSubmitting}
              onClick={handleConfirmAndProceed}
              className="gap-1.5 text-xs font-semibold shadow-md shadow-blue-500/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Assigning Role...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Confirm & Continue</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
