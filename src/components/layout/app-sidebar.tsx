'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { PORTAL_CONFIGS, type PortalArea } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { APP_CONFIG } from '@/lib/constants';

interface AppSidebarProps {
  area: PortalArea;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export function AppSidebar({
  area,
  isCollapsed = false,
  onToggleCollapse,
  className,
}: AppSidebarProps) {
  const pathname = usePathname();
  const config = PORTAL_CONFIGS[area];

  return (
    <aside
      className={cn(
        'relative hidden lg:flex flex-col border-r border-border/70 bg-card/60 backdrop-blur-xl transition-all duration-300 z-30 select-none',
        isCollapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      {/* Sidebar Header: Brand & Area Identity */}
      <div className="flex h-16 items-center justify-between border-b border-border/60 px-4">
        <Link
          href="/"
          className={cn(
            'flex items-center gap-2.5 overflow-hidden transition-all',
            isCollapsed && 'justify-center w-full'
          )}
          title="Return to CampusServe Home"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-blue-500/20">
            <GraduationCap className="h-5 w-5" />
          </div>

          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-sm tracking-tight text-foreground truncate">
                {APP_CONFIG.name}
              </span>
              <span className="text-[10px] font-semibold text-primary truncate">
                {config.roleLabel}
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {config.navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!isCollapsed && group.label && (
              <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-2">
                {group.label}
              </h4>
            )}

            <nav className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    title={isCollapsed ? item.title : undefined}
                    className={cn(
                      'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                        : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                      isCollapsed && 'justify-center px-0'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-transform group-hover:scale-110',
                        isActive
                          ? 'text-primary-foreground'
                          : 'text-muted-foreground group-hover:text-foreground'
                      )}
                    />

                    {!isCollapsed && (
                      <>
                        <span className="flex-1 truncate">{item.title}</span>
                        {item.badge && (
                          <Badge
                            variant={item.badgeVariant || 'secondary'}
                            className={cn(
                              'text-[10px] px-1.5 py-0 h-4 font-mono',
                              isActive && 'bg-primary-foreground/20 text-primary-foreground border-transparent'
                            )}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Bottom Area: Operational Status & Collapse Toggle */}
      <div className="p-3 border-t border-border/60 space-y-3">
        {!isCollapsed && (
          <div className="rounded-xl border border-border/60 bg-muted/40 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-foreground">
                Campus Sync
              </span>
              <StatusIndicator status="online" size="sm" label="Live" pulse={false} />
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Razorpay Test & Neon connected.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <Link
              href="/"
              className="text-[11px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-2 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              <span>Public Landing</span>
            </Link>
          )}

          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className={cn('h-8 w-8 rounded-lg', isCollapsed && 'mx-auto')}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
