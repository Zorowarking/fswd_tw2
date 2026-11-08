'use client';

import * as React from 'react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { PortalHeader } from '@/components/layout/portal-header';
import type { PortalArea } from '@/lib/navigation';
import type { BreadcrumbItem } from '@/components/layout/breadcrumbs';

interface PortalShellProps {
  children: React.ReactNode;
  area: PortalArea;
  breadcrumbs?: BreadcrumbItem[];
}

export function PortalShell({
  children,
  area,
  breadcrumbs = [],
}: PortalShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  const defaultBreadcrumbs: BreadcrumbItem[] = [
    {
      label: area === 'student' ? 'Student Portal' : area === 'provider' ? 'Provider Desk' : 'Campus Admin',
      href: `/${area}`,
    },
    ...breadcrumbs,
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Collapsible Sidebar */}
      <AppSidebar
        area={area}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main App Canvas */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
        {/* Top Header */}
        <PortalHeader area={area} breadcrumbs={defaultBreadcrumbs} />

        {/* Page View */}
        <main className="flex-1 bg-muted/20 pb-16">{children}</main>
      </div>
    </div>
  );
}
