'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  GraduationCap,
  Menu,
  PhoneCall,
  Search,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { PORTAL_CONFIGS, type PortalArea } from '@/lib/navigation';
import { APP_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  area: PortalArea;
}

export function MobileNav({ area }: MobileNavProps) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const config = PORTAL_CONFIGS[area];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-xl lg:hidden"
          aria-label="Open mobile navigation"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[300px] p-0 sm:w-[340px] flex flex-col">
        {/* Brand Header */}
        <SheetHeader className="p-4 border-b border-border/60 text-left">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="text-sm font-bold text-foreground">
                {APP_CONFIG.name}
              </SheetTitle>
              <Badge variant="glow" className="text-[10px] px-1.5 py-0 mt-0.5">
                {config.roleLabel}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        {/* Quick Search */}
        <div className="p-4 border-b border-border/40">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search services or orders..."
              className="h-8 pl-8 text-xs bg-muted/40"
            />
          </div>
        </div>

        {/* Navigation Area Switcher */}
        <div className="p-3 bg-muted/20 border-b border-border/40">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
            Switch Perspective
          </span>
          <div className="mt-1.5 grid grid-cols-3 gap-1">
            <Link href="/student" onClick={() => setOpen(false)}>
              <Button
                variant={area === 'student' ? 'default' : 'outline'}
                size="sm"
                className="w-full text-[10px] h-7 px-1"
              >
                Student
              </Button>
            </Link>
            <Link href="/provider" onClick={() => setOpen(false)}>
              <Button
                variant={area === 'provider' ? 'default' : 'outline'}
                size="sm"
                className="w-full text-[10px] h-7 px-1"
              >
                Provider
              </Button>
            </Link>
            <Link href="/admin" onClick={() => setOpen(false)}>
              <Button
                variant={area === 'admin' ? 'default' : 'outline'}
                size="sm"
                className="w-full text-[10px] h-7 px-1"
              >
                Admin
              </Button>
            </Link>
          </div>
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {config.navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {group.label && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
                  {group.label}
                </span>
              )}
              <div className="space-y-1 mt-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{item.title}</span>
                      {item.badge && (
                        <Badge
                          variant={item.badgeVariant || 'secondary'}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Contacts */}
        <div className="p-4 border-t border-border/60 bg-muted/30 space-y-2 text-xs">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium"
          >
            <ExternalLink className="h-3 w-3" />
            <span>Public Home Landing</span>
          </Link>
          <div className="flex items-center gap-1.5 text-muted-foreground/80 text-[11px]">
            <PhoneCall className="h-3 w-3 text-primary" />
            <span>Emergency Help: {APP_CONFIG.emergencyDesk}</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
