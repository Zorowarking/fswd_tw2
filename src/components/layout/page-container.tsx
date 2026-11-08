import * as React from 'react';
import { cn } from '@/lib/utils';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/layout/breadcrumbs';

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '7xl' | 'full';
}

export function PageContainer({
  children,
  title,
  description,
  badge,
  actions,
  breadcrumbs,
  className,
  maxWidth = '7xl',
}: PageContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  }[maxWidth];

  return (
    <div className={cn('mx-auto w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8', maxWidthClasses, className)}>
      {/* Mobile Breadcrumb display */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-4 sm:hidden">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      )}

      {/* Page Header Header Row */}
      {(title || description || actions || badge) && (
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              {title && (
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                  {title}
                </h1>
              )}
              {badge}
            </div>
            {description && (
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {actions && (
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div>{children}</div>
    </div>
  );
}
