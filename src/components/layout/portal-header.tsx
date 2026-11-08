'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/layout/breadcrumbs';
import { NotificationMenu } from '@/components/layout/notification-menu';
import { UserProfileMenu } from '@/components/layout/user-profile-menu';
import { MobileNav } from '@/components/layout/mobile-nav';
import type { PortalArea } from '@/lib/navigation';

interface PortalHeaderProps {
  area: PortalArea;
  breadcrumbs?: BreadcrumbItem[];
}

export function PortalHeader({ area, breadcrumbs = [] }: PortalHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border/70 bg-background/80 px-4 sm:px-6 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      {/* Left: Mobile Nav Drawer Trigger + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <MobileNav area={area} />

        <div className="hidden sm:block">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      </div>

      {/* Center: Search Field */}
      <div className="hidden md:flex items-center max-w-sm w-full mx-4">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campus services, bookings, tokens..."
            className="h-9 pl-8 text-xs bg-muted/40 rounded-xl border-border/70 focus:bg-background transition-all"
          />
        </div>
      </div>

      {/* Right Controls: Area Pill, Notifications, User Menu */}
      <div className="flex items-center gap-2.5">
        <Badge
          variant="glow"
          className="hidden sm:inline-flex capitalize text-[11px] px-2.5 py-0.5"
        >
          {area} Portal
        </Badge>

        <NotificationMenu />

        <UserProfileMenu currentArea={area} />
      </div>
    </header>
  );
}
