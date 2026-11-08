'use client';

import { Toaster as Sonner, toast } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-xl group-[.toaster]:rounded-2xl group-[.toaster]:border',
          description: 'group-[.toast]:text-muted-foreground text-xs',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg text-xs font-semibold',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg text-xs',
          success: 'group-[.toaster]:border-emerald-500/30 group-[.toaster]:text-emerald-950 dark:group-[.toaster]:text-emerald-200',
          error: 'group-[.toaster]:border-rose-500/30 group-[.toaster]:text-rose-950 dark:group-[.toaster]:text-rose-200',
          warning: 'group-[.toaster]:border-amber-500/30 group-[.toaster]:text-amber-950 dark:group-[.toaster]:text-amber-200',
          info: 'group-[.toaster]:border-blue-500/30 group-[.toaster]:text-blue-950 dark:group-[.toaster]:text-blue-200',
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
