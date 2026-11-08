'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import {
  Settings,
  LogOut,
  ChevronDown,
  CreditCard,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/sonner';
import type { PortalArea } from '@/lib/navigation';
import { switchPerspectiveRoleAction } from '@/app/actions/role-actions';
import { invalidateClientRoleCache } from '@/hooks/use-user-role';

interface UserProfileMenuProps {
  currentArea?: PortalArea;
}

export function UserProfileMenu({ currentArea = 'student' }: UserProfileMenuProps) {
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const [isSwitchingPerspective, setIsSwitchingPerspective] = React.useState(false);

  const handlePerspectiveSwitch = async (targetArea: 'student' | 'provider' | 'admin') => {
    if (targetArea === currentArea) return;
    setIsSwitchingPerspective(true);
    const targetRoleMap = {
      student: 'STUDENT' as const,
      provider: 'SERVICE_PROVIDER' as const,
      admin: 'ADMIN' as const,
    };

    try {
      const res = await switchPerspectiveRoleAction(targetRoleMap[targetArea]);
      if (res.success && res.redirectUrl) {
        invalidateClientRoleCache();
        toast.success(`Switched portal perspective to ${targetArea.toUpperCase()}`);
        router.push(res.redirectUrl);
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to switch perspective');
      }
    } catch {
      toast.error('Network error switching perspective');
    } finally {
      setIsSwitchingPerspective(false);
    }
  };

  const getFallbackProfileData = () => {
    switch (currentArea) {
      case 'provider':
        return {
          name: 'Sunil Kumar',
          email: 'sunil.canteen@campusserve.edu',
          idBadge: 'Vendor Partner #V-104',
          roleBadge: 'VENDOR',
          roleColor: 'warning' as const,
        };
      case 'admin':
        return {
          name: 'Dr. Anita Roy',
          email: 'dean.infra@campusserve.edu',
          idBadge: 'Admin Officer #A-001',
          roleBadge: 'CAMPUS ADMIN',
          roleColor: 'destructive' as const,
        };
      case 'student':
      default:
        return {
          name: 'Aarav Sharma',
          email: 'aarav.22cs@campusserve.edu',
          idBadge: 'Student ID: 2024CSB1042',
          roleBadge: 'STUDENT',
          roleColor: 'success' as const,
        };
    }
  };

  const fallback = getFallbackProfileData();

  const displayName = isSignedIn && user ? (user.fullName || user.firstName || fallback.name) : fallback.name;
  const displayEmail = isSignedIn && user ? (user.primaryEmailAddress?.emailAddress || fallback.email) : fallback.email;
  const avatarUrl = isSignedIn && user ? user.imageUrl : null;

  const handleSignOut = async () => {
    try {
      if (isSignedIn) {
        await signOut();
      }
      toast.info('Signed out successfully');
      router.push('/');
    } catch {
      router.push('/');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex h-9 items-center gap-2 rounded-xl border-border/80 bg-background/60 px-2.5 shadow-sm hover:bg-muted"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-6 w-6 rounded-lg object-cover ring-1 ring-primary/20"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-[11px] font-bold text-white shadow-sm">
              {displayName.charAt(0)}
            </div>
          )}
          <div className="hidden text-left sm:block">
            <p className="text-xs font-bold leading-none text-foreground line-clamp-1">
              {displayName}
            </p>
          </div>
          <ChevronDown className="h-3 w-3 text-muted-foreground opacity-70" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 rounded-2xl border-border bg-popover/95 p-1 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex items-center gap-3 p-3 border-b border-border/60">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-primary/20 shadow-md"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-md">
              {displayName.charAt(0)}
            </div>
          )}
          <div className="flex flex-col space-y-0.5 overflow-hidden">
            <span className="font-bold text-xs text-foreground truncate">
              {displayName}
            </span>
            <span className="text-[11px] text-muted-foreground truncate">
              {displayEmail}
            </span>
            <div className="flex items-center gap-1 mt-1">
              <Badge variant={fallback.roleColor} className="text-[9px] px-1.5 py-0">
                {fallback.roleBadge}
              </Badge>
              {isSignedIn && (
                <Badge variant="glow" className="text-[9px] px-1 py-0 gap-0.5">
                  <ShieldCheck className="h-2.5 w-2.5 text-emerald-500" />
                  <span>Clerk</span>
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Portal Area Switcher for layout exploration */}
        <div className="p-2 border-b border-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
            Switch Portal Perspective
          </span>
          <div className="mt-1.5 grid grid-cols-3 gap-1">
            <Button
              variant={currentArea === 'student' ? 'default' : 'ghost'}
              size="sm"
              disabled={isSwitchingPerspective}
              onClick={() => void handlePerspectiveSwitch('student')}
              className="w-full text-[10px] h-7 px-1"
            >
              Student
            </Button>
            <Button
              variant={currentArea === 'provider' ? 'default' : 'ghost'}
              size="sm"
              disabled={isSwitchingPerspective}
              onClick={() => void handlePerspectiveSwitch('provider')}
              className="w-full text-[10px] h-7 px-1"
            >
              Provider
            </Button>
            <Button
              variant={currentArea === 'admin' ? 'default' : 'ghost'}
              size="sm"
              disabled={isSwitchingPerspective}
              onClick={() => void handlePerspectiveSwitch('admin')}
              className="w-full text-[10px] h-7 px-1"
            >
              Admin
            </Button>
          </div>
        </div>

        <DropdownMenuGroup className="py-1">
          {currentArea === 'student' && (
            <Link href="/student/profile">
              <DropdownMenuItem className="cursor-pointer gap-2 text-xs font-semibold text-primary">
                <UserIcon className="h-3.5 w-3.5 text-primary" />
                <span>Student Profile & Settings</span>
              </DropdownMenuItem>
            </Link>
          )}

          {currentArea === 'provider' && (
            <Link href="/provider/profile">
              <DropdownMenuItem className="cursor-pointer gap-2 text-xs font-semibold text-indigo-400">
                <UserIcon className="h-3.5 w-3.5 text-indigo-400" />
                <span>Provider Profile & Desk Settings</span>
              </DropdownMenuItem>
            </Link>
          )}

          <Link href="/profile">
            <DropdownMenuItem className="cursor-pointer gap-2 text-xs">
              <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Clerk Security Profile</span>
            </DropdownMenuItem>
          </Link>

          <DropdownMenuItem
            className="cursor-pointer gap-2 text-xs"
            onClick={() => toast.info(`Digital ID Badge: ${fallback.idBadge}`)}
          >
            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Digital ID: {fallback.idBadge}</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer gap-2 text-xs"
            onClick={() => toast.info('Notification preferences loaded')}
          >
            <Settings className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Campus Notification Rules</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer gap-2 text-xs text-destructive focus:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
