'use client';

import * as React from 'react';
import { AlertTriangle, Trash2, ShieldAlert, Power, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ServiceDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: {
    id: string;
    name: string;
    canDelete: boolean;
    deleteRestrictionReason: string | null;
    isActive: boolean;
    totalBookings: number;
    activeBookings: number;
  } | null;
  onConfirmDelete: (serviceId: string) => Promise<void>;
  onDeactivateInstead?: (serviceId: string) => Promise<void>;
}

export function ServiceDeleteDialog({
  open,
  onOpenChange,
  service,
  onConfirmDelete,
  onDeactivateInstead,
}: ServiceDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isDeactivating, setIsDeactivating] = React.useState(false);

  if (!service) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirmDelete(service.id);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!onDeactivateInstead) return;
    setIsDeactivating(true);
    try {
      await onDeactivateInstead(service.id);
      onOpenChange(false);
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                service.canDelete
                  ? 'bg-rose-500/10 text-rose-500'
                  : 'bg-amber-500/10 text-amber-500'
              }`}
            >
              {service.canDelete ? (
                <Trash2 className="h-5 w-5" />
              ) : (
                <ShieldAlert className="h-5 w-5" />
              )}
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                {service.canDelete ? 'Delete Service' : 'Deletion Restricted'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground line-clamp-1">
                {service.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {service.canDelete ? (
          <div className="space-y-3 py-2 text-xs text-muted-foreground">
            <p>
              Are you sure you want to permanently delete{' '}
              <strong className="text-foreground">&ldquo;{service.name}&rdquo;</strong>?
            </p>
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-rose-600 dark:text-rose-400">
              <p className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  This action is permanent and cannot be undone. All configured pricing, capacity, and
                  service settings will be permanently removed.
                </span>
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300 space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Cannot Delete Active Booking Records</span>
              </div>
              <p className="leading-relaxed">
                {service.deleteRestrictionReason ||
                  'This service cannot be deleted because it is associated with existing or historical campus booking records.'}
              </p>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-3 text-xs">
              <div>
                <p className="font-semibold text-foreground">Recommended Action</p>
                <p className="text-muted-foreground text-[11px]">
                  Deactivate the service to hide it from students while preserving records.
                </p>
              </div>
              <Badge variant={service.isActive ? 'glow' : 'outline'}>
                {service.isActive ? 'Currently Active' : 'Already Inactive'}
              </Badge>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting || isDeactivating}
            className="text-xs"
          >
            Cancel
          </Button>

          {service.canDelete ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-xs gap-1.5"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Confirm Delete</span>
                </>
              )}
            </Button>
          ) : (
            service.isActive &&
            onDeactivateInstead && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleDeactivate}
                disabled={isDeactivating}
                className="text-xs gap-1.5 border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
              >
                {isDeactivating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Deactivating...</span>
                  </>
                ) : (
                  <>
                    <Power className="h-3.5 w-3.5" />
                    <span>Deactivate Service</span>
                  </>
                )}
              </Button>
            )
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
