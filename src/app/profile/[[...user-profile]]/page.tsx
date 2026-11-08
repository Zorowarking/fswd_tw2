import Link from 'next/link';
import { UserProfile } from '@clerk/nextjs';
import { Shield, ArrowRight, GraduationCap, Building2 } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { requireAssignedRole, getRoleDashboardUrl } from '@/lib/auth-role';
import { getProviderActiveObligations } from '@/app/actions/role-actions';
import { ProfileAccountTypeManager } from '@/components/profile/profile-account-type-manager';

export default async function ProfilePage() {
  // Absolute route protection: requires active session and an assigned role
  // Unauthenticated -> /sign-in?redirect_url=/profile
  // Role = NULL -> /select-role
  const user = await requireAssignedRole('/profile');

  // Query obligations if provider
  const obligations = await getProviderActiveObligations();

  const dashboardUrl = getRoleDashboardUrl(user.role);
  const portalName =
    user.role === 'STUDENT'
      ? 'Student Portal'
      : user.role === 'SERVICE_PROVIDER'
      ? 'Provider Desk'
      : 'Admin Console';

  return (
    <PageContainer
      title="User Account & Security Profile"
      description="Manage your campus role configuration, Clerk authentication credentials, active browser sessions, and security verification."
      badge={
        <Badge variant="glow" className="text-[10px] gap-1">
          <Shield className="h-3 w-3 text-emerald-500" />
          <span>Clerk & PostgreSQL Synchronized</span>
        </Badge>
      }
      breadcrumbs={[
        { label: portalName, href: dashboardUrl },
        { label: 'Security Profile', active: true },
      ]}
    >
      <div className="flex flex-col items-center justify-center py-6">
        {/* Dedicated Student Portal Profile Shortcut */}
        {user.role === 'STUDENT' && (
          <div className="w-full max-w-4xl mb-6 p-4 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-card to-card flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="space-y-0.5 text-center sm:text-left">
                <p className="text-xs font-bold text-foreground">Dedicated Student Profile & Settings</p>
                <p className="text-[11px] text-muted-foreground">
                  Update student coordinates, phone number, hostel room, and booking preferences.
                </p>
              </div>
            </div>
            <Link href="/student/profile">
              <Button size="sm" variant="gradient" className="gap-1.5 text-xs font-semibold shrink-0">
                <span>View Student Profile</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        )}

        {/* Dedicated Service Provider Desk Profile Shortcut */}
        {user.role === 'SERVICE_PROVIDER' && (
          <div className="w-full max-w-4xl mb-6 p-4 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-card to-card flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="space-y-0.5 text-center sm:text-left">
                <p className="text-xs font-bold text-foreground">Dedicated Provider Profile & Desk Settings</p>
                <p className="text-[11px] text-muted-foreground">
                  Manage store coordinates, physical campus location, operating hours, and services catalog.
                </p>
              </div>
            </div>
            <Link href="/provider/profile">
              <Button size="sm" variant="gradient" className="gap-1.5 text-xs font-semibold shrink-0 shadow-md shadow-indigo-500/20">
                <span>View Provider Profile</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        )}

        {/* Account Type and Role Switching Section */}
        {user.role && (
          <ProfileAccountTypeManager
            currentRole={user.role}
            activeObligationsCount={obligations.activeBookingsCount}
          />
        )}

        {/* Official Clerk Profile Component */}
        <UserProfile
          routing="path"
          path="/profile"
          appearance={{
            elements: {
              rootBox: 'w-full max-w-4xl shadow-2xl rounded-2xl border border-border/80',
              card: 'border-0 shadow-none bg-card',
            },
          }}
        />
      </div>
    </PageContainer>
  );
}
