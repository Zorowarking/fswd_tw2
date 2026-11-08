'use client';

import * as React from 'react';
import { Power, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ServiceStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: {
    id: string;
    name: string;
    isActive: boolean;
  } | null;
  onConfirmToggle: (serviceId: string) => Promise<void>;
}

export function ServiceStatusDialog({
  open,
  onOpenChange,
  service,
  onConfirmToggle,
}: ServiceStatusDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!service) return null;

  const isDeactivating = service.isActive;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirmToggle(service.id);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                isDeactivating
                  ? 'bg-amber-500/10 text-amber-500'
                  : 'bg-emerald-500/10 text-emerald-500'
              }`}
            >
              {isDeactivating ? (
                <Power className="h-5 w-5" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                {isDeactivating ? 'Deactivate Service?' : 'Activate Service?'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground line-clamp-1">
                {service.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-2 text-xs text-muted-foreground space-y-2">
          {isDeactivating ? (
            <>
              <p>
                When deactivated, <strong className="text-foreground">&ldquo;{service.name}&rdquo;</strong> will be
                hidden from the campus service catalog.
              </p>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-amber-600 dark:text-amber-400">
                <p className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    Students will no longer be able to submit new booking orders or reserve slots for
                    this service. Any existing confirmed orders will remain valid.
                  </span>
                </p>
              </div>
            </>
          ) : (
            <>
              <p>
                Activating this service will publish{' '}
                <strong className="text-foreground">&ldquo;{service.name}&rdquo;</strong> to the campus catalog.
              </p>
              <p>
                Verified students across campus will be able to discover, view slot availability, and book
                this service.
              </p>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant={isDeactivating ? 'secondary' : 'gradient'}
            size="sm"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`text-xs gap-1.5 ${
              isDeactivating
                ? 'border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                : ''
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Updating...</span>
              </>
            ) : isDeactivating ? (
              <>
                <Power className="h-3.5 w-3.5" />
                <span>Confirm Deactivation</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Publish & Activate</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
