'use client';

import * as React from 'react';
import { LucideIcon, SearchX, Inbox, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-border/70 bg-card/40 backdrop-blur-xs',
        compact ? 'p-6 sm:p-8' : 'p-8 sm:p-14',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground shadow-xs ring-1 ring-border/50 mb-4',
          compact ? 'h-12 w-12' : 'h-16 w-16'
        )}
      >
        <Icon className={cn('text-primary/80', compact ? 'h-6 w-6' : 'h-8 w-8')} />
      </div>

      <h3
        className={cn(
          'font-bold tracking-tight text-foreground',
          compact ? 'text-sm sm:text-base' : 'text-base sm:text-lg'
        )}
      >
        {title}
      </h3>

      <p
        className={cn(
          'text-muted-foreground max-w-sm mt-1.5 leading-relaxed',
          compact ? 'text-xs' : 'text-xs sm:text-sm'
        )}
      >
        {description}
      </p>

      {(actionLabel && (onAction || actionHref)) && (
        <div className="mt-5">
          {actionHref ? (
            <Button asChild size="sm" variant="outline" className="gap-2 text-xs rounded-xl shadow-xs">
              <a href={actionHref}>
                <span>{actionLabel}</span>
              </a>
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onAction}
              className="gap-2 text-xs rounded-xl shadow-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{actionLabel}</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function TableEmptyState({
  colSpan,
  icon = SearchX,
  title = 'No records found',
  description = 'No items match your active search query or filter selection.',
  actionLabel,
  onAction,
}: {
  colSpan: number;
  icon?: LucideIcon;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-8 sm:p-12">
        <EmptyState
          compact
          icon={icon}
          title={title}
          description={description}
          actionLabel={actionLabel}
          onAction={onAction}
          className="border-0 bg-transparent p-0"
        />
      </td>
    </tr>
  );
}

