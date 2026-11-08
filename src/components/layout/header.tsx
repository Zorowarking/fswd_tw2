'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useAuth } from '@clerk/nextjs';
import { GraduationCap, Menu, ArrowRight, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useUserRole } from '@/hooks/use-user-role';
import { APP_CONFIG } from '@/lib/constants';
import { NotificationMenu } from '@/components/layout/notification-menu';

interface NavItem {
  label: string;
  href: string;
}

const PUBLIC_NAV: NavItem[] = [
  { label: 'Browse Services', href: '/services' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'About', href: '/#about' },
];

const STUDENT_NAV: NavItem[] = [
  { label: 'Browse Services', href: '/student/services' },
  { label: 'My Bookings', href: '/student/bookings' },
  { label: 'Dashboard', href: '/student/dashboard' },
];

const PROVIDER_NAV: NavItem[] = [
  { label: 'My Services', href: '/provider/services' },
  { label: 'Bookings Queue', href: '/provider/bookings' },
  { label: 'Availability', href: '/provider/availability' },
  { label: 'Dashboard', href: '/provider/dashboard' },
];

const ADMIN_NAV: NavItem[] = [
  { label: 'Admin Dashboard', href: '/admin/dashboard' },
  { label: 'Categories', href: '/admin/categories' },
  { label: 'Services', href: '/admin/dashboard#services' },
  { label: 'Bookings', href: '/admin/dashboard#bookings' },
];

function HeaderContent() {
  const { isSignedIn, isLoaded } = useAuth();
  const { role } = useUserRole();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Compute navigation links based on user role
  const navItems = React.useMemo(() => {
    if (!isSignedIn) {
      return PUBLIC_NAV;
    }

    switch (role) {
      case 'STUDENT':
        return STUDENT_NAV;
      case 'SERVICE_PROVIDER':
        return PROVIDER_NAV;
      case 'ADMIN':
        return ADMIN_NAV;
      default:
        // Authenticated user with role NULL: strictly restricted to onboarding.
        // Remove all normal navigation links and discovery shortcuts.
        return [];
    }
  }, [isSignedIn, role]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Left: Logo, Name, and Tagline */}
        <Link
          href={role ? '/' : '/select-role'}
          className="flex items-center gap-3 transition-opacity hover:opacity-90"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white shadow-sm shadow-blue-500/25">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-foreground leading-tight">
              {APP_CONFIG.name}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground leading-none">
              Smart Campus Services
            </span>
          </div>
        </Link>

        {/* Center / Main Navigation (Desktop) - Only rendered when there are navigation items */}
        {navItems.length > 0 && (
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href.includes('#') && pathname === item.href.split('#')[0]);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={
                    isActive
                      ? 'text-sm font-semibold text-foreground transition-colors'
                      : 'text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right Section: Auth State */}
        <div className="hidden sm:flex items-center gap-3">
          {isLoaded && !isSignedIn && (
            <>
              <Link href="/sign-in">
                <Button variant="ghost" size="sm" className="text-sm font-medium">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" variant="gradient" className="gap-1.5 text-sm font-semibold shadow-sm shadow-blue-500/20">
                  <span>Get Started</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </>
          )}

          {isLoaded && isSignedIn && (
            <div className="flex items-center gap-3">
              <NotificationMenu />
              {role && (
                <Link href={role === 'STUDENT' ? '/student/dashboard' : role === 'SERVICE_PROVIDER' ? '/provider/dashboard' : '/admin/dashboard'}>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    <span>Dashboard</span>
                  </Button>
                </Link>
              )}
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: 'h-8 w-8 ring-2 ring-primary/20',
                  },
                }}
              />
            </div>
          )}
        </div>

        {/* Mobile Navigation Drawer (shadcn Sheet) */}
        <div className="flex items-center gap-2 md:hidden">
          {isLoaded && isSignedIn && <NotificationMenu />}
          {isLoaded && isSignedIn && (
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: 'h-8 w-8 ring-2 ring-primary/20',
                },
              }}
            />
          )}

          {/* Only render mobile menu if user is signed out or has an assigned role */}
          {(!isSignedIn || !!role) && (
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-foreground"
                  aria-label="Open mobile navigation menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="flex flex-col justify-between w-[280px] sm:w-[320px] p-6">
                <div className="space-y-6">
                  <SheetHeader className="text-left space-y-1">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <SheetTitle className="text-base font-bold text-foreground">
                        {APP_CONFIG.name}
                      </SheetTitle>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Smart Campus Services
                    </p>
                  </SheetHeader>

                  <nav className="flex flex-col space-y-3 pt-4">
                    {navItems.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                </div>

                {/* Mobile Auth Actions */}
                <div className="pt-6 border-t border-border/60">
                  {!isSignedIn ? (
                    <div className="flex flex-col gap-2">
                      <Link href="/sign-in" onClick={() => setMobileOpen(false)}>
                        <Button variant="outline" className="w-full justify-center text-sm font-medium">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/sign-up" onClick={() => setMobileOpen(false)}>
                        <Button variant="gradient" className="w-full justify-center text-sm font-semibold gap-1.5 shadow-sm shadow-blue-500/20">
                          <span>Get Started</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 py-2">
                      {role && (
                        <Link
                          href={role === 'STUDENT' ? '/student/dashboard' : role === 'SERVICE_PROVIDER' ? '/provider/dashboard' : '/admin/dashboard'}
                          onClick={() => setMobileOpen(false)}
                        >
                          <Button variant="gradient" className="w-full justify-center text-xs font-semibold gap-2 shadow-sm shadow-blue-500/20">
                            <LayoutDashboard className="h-4 w-4" />
                            <span>Open {role === 'STUDENT' ? 'Student' : role === 'SERVICE_PROVIDER' ? 'Provider' : 'Admin'} Dashboard</span>
                          </Button>
                        </Link>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                        <span>Role: <strong className="text-foreground">{role}</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  );
}

function HeaderFallback() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white shadow-sm shadow-blue-500/25">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-foreground leading-tight">
              {APP_CONFIG.name}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground leading-none">
              Smart Campus Services
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {PUBLIC_NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden sm:flex items-center gap-3">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm" className="text-sm font-medium">
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm" variant="gradient" className="gap-1.5 text-sm font-semibold shadow-sm shadow-blue-500/20">
              <span>Get Started</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function Header() {
  return (
    <React.Suspense fallback={<HeaderFallback />}>
      <HeaderContent />
    </React.Suspense>
  );
}

