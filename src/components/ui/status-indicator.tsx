import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const statusIndicatorVariants = cva(
  'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-200',
  {
    variants: {
      status: {
        online:
          'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
        busy:
          'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
        offline:
          'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300',
        in_progress:
          'border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300',
        maintenance:
          'border-purple-500/25 bg-purple-500/10 text-purple-700 dark:text-purple-300',
        neutral:
          'border-border bg-muted/50 text-muted-foreground',
      },
      size: {
        sm: 'px-2 py-0.5 text-[11px]',
        default: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      status: 'online',
      size: 'default',
    },
  }
);

const dotVariants = cva('rounded-full', {
  variants: {
    status: {
      online: 'bg-emerald-500',
      busy: 'bg-amber-500',
      offline: 'bg-rose-500',
      in_progress: 'bg-blue-500',
      maintenance: 'bg-purple-500',
      neutral: 'bg-muted-foreground',
    },
    size: {
      sm: 'h-1.5 w-1.5',
      default: 'h-2 w-2',
      lg: 'h-2.5 w-2.5',
    },
  },
  defaultVariants: {
    status: 'online',
    size: 'default',
  },
});

export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusIndicatorVariants> {
  label: string;
  pulse?: boolean;
}

export function StatusIndicator({
  className,
  status = 'online',
  size = 'default',
  label,
  pulse = true,
  ...props
}: StatusIndicatorProps) {
  return (
    <div
      className={cn(statusIndicatorVariants({ status, size, className }))}
      {...props}
    >
      <span className="relative flex items-center justify-center">
        {pulse && status !== 'neutral' && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
              dotVariants({ status })
            )}
          />
        )}
        <span className={cn('relative inline-flex', dotVariants({ status, size }))} />
      </span>
      <span>{label}</span>
    </div>
  );
}
