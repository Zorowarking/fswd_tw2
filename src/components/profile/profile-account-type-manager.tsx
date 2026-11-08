'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  Building2,
  Shield,
  ArrowLeftRight,
  Check,
  Loader2,
  AlertTriangle,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';
import { Role } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { switchUserRole } from '@/app/actions/role-actions';
import { invalidateClientRoleCache } from '@/hooks/use-user-role';

interface ProfileAccountTypeManagerProps {
  currentRole: Role;
  activeObligationsCount?: number;
}

export function ProfileAccountTypeManager({
  currentRole,
  activeObligationsCount = 0,
}: ProfileAccountTypeManagerProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const targetRole =
    currentRole === Role.STUDENT ? Role.SERVICE_PROVIDER : Role.STUDENT;

  const targetRoleLabel =
    targetRole === Role.STUDENT ? 'Student' : 'Service Provider';

  const handleConfirmRoleSwitch = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await switchUserRole(
        targetRole === Role.STUDENT ? 'STUDENT' : 'SERVICE_PROVIDER'
      );

      if (!result.success || !result.redirectUrl) {
        setErrorMessage(
          result.error || 'Failed to update account role. Please try again.'
        );
        setIsSubmitting(false);
        return;
      }

      // Invalidate client-side presentation cache
      invalidateClientRoleCache();

      setDialogOpen(false);
      router.push(result.redirectUrl);
      router.refresh();
    } catch (err: unknown) {
      console.error('[Profile Role Switch Error]:', err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'A network or server error occurred while updating your role.'
      );
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="w-full max-w-4xl border-border/80 shadow-lg bg-card/80 backdrop-blur-xl mb-6">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-foreground">
                  Account Type
                </CardTitle>
                <Badge
                  variant={
                    currentRole === Role.STUDENT
                      ? 'success'
                      : currentRole === Role.SERVICE_PROVIDER
                      ? 'warning'
                      : 'destructive'
                  }
                  className="text-[11px] px-2.5 py-0.5"
                >
                  {currentRole === Role.STUDENT && 'Student Account'}
                  {currentRole === Role.SERVICE_PROVIDER && 'Service Provider Desk'}
                  {currentRole === Role.ADMIN && 'Institutional Administrator'}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Your account type determines your default dashboard, accessible tools, and permissions.
              </CardDescription>
            </div>

            {currentRole !== Role.ADMIN && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setErrorMessage(null);
                  setDialogOpen(true);
                }}
                className="gap-2 text-xs font-semibold shrink-0 border-primary/30 hover:bg-primary/5"
                id="btn-profile-change-role"
              >
                <ArrowLeftRight className="h-3.5 w-3.5 text-primary" />
                <span>Change Account Type</span>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-2 text-xs text-muted-foreground space-y-2">
          {currentRole === Role.STUDENT && (
            <div className="flex items-start gap-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
              <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="text-foreground/90">
                You are currently configured as a <strong>Student</strong>. You have access to the Campus Services Directory, booking reservations, and test payment settlement.
              </div>
            </div>
          )}

          {currentRole === Role.SERVICE_PROVIDER && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
              <Building2 className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-foreground/90">
                You are currently configured as a <strong>Service Provider</strong>. You have access to the Provider Desk to list campus facilities, schedule availability, and fulfill booking orders.
              </div>
            </div>
          )}

          {currentRole === Role.ADMIN && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
              <Shield className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-foreground/90">
                Administrator permissions are governed by campus infrastructure policy and cannot be altered through self-service profile switching.
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0 pb-4 text-[11px] text-muted-foreground">
          Historical records, previous payments, reviews, and listed services are always preserved safely in PostgreSQL when changing roles.
        </CardFooter>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl border-border bg-card p-6 shadow-2xl">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <HelpCircle className="h-5 w-5" />
              <DialogTitle className="text-lg font-bold">
                Confirm Account Type Change
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to change your account type from{' '}
              <strong className="text-foreground">
                {currentRole === Role.STUDENT ? 'Student' : 'Service Provider'}
              </strong>{' '}
              to <strong className="text-foreground">{targetRoleLabel}</strong>?
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="my-2 space-y-3">
            <div className="rounded-xl border border-border/80 bg-muted/40 p-3.5 text-xs text-foreground/90 space-y-1.5">
              <div className="font-semibold text-primary">
                What will change:
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                {targetRole === Role.STUDENT
                  ? 'Your workspace will switch to the Student Services Portal (/student/dashboard). You will be able to browse services and reserve campus amenities.'
                  : 'Your workspace will switch to the Service Provider Desk (/provider/dashboard). You will be able to create service listings, manage availability slots, and fulfill orders.'}
              </p>
              <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                All existing bookings, services, and transactions remain completely intact and linked to your account.
              </p>
            </div>

            {/* Provider active obligations warning & blocking */}
            {currentRole === Role.SERVICE_PROVIDER && activeObligationsCount > 0 && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <div className="text-[11px] leading-relaxed">
                  <strong>Transition Blocked:</strong> You currently have{' '}
                  <strong>{activeObligationsCount}</strong> active or pending booking request(s).
                  To maintain campus service reliability, you must fulfill, resolve, or cancel all active bookings before switching to a Student account.
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setDialogOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              size="sm"
              disabled={isSubmitting || (currentRole === Role.SERVICE_PROVIDER && activeObligationsCount > 0)}
              onClick={handleConfirmRoleSwitch}
              className="gap-1.5 text-xs font-semibold shadow-md shadow-blue-500/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Updating Role...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Confirm & Switch to {targetRoleLabel}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

