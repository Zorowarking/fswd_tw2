'use client';

import * as React from 'react';
import { Flag, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import { reportReviewAction } from '@/app/actions/review-actions';

interface ReportReviewDialogProps {
  reviewId: string;
  studentName?: string;
}

export function ReportReviewDialog({ reviewId, studentName }: ReportReviewDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Please specify why this review is being reported.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await reportReviewAction(reviewId, reason.trim());
      if (res.success) {
        toast.success('Report submitted. Campus administration has been notified.');
        setOpen(false);
        setReason('');
      } else {
        toast.error(res.error || 'Failed to submit report.');
      }
    } catch {
      toast.error('An error occurred while reporting this review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-rose-500 transition-colors"
          title="Report this review for moderation"
        >
          <Flag className="h-3 w-3" />
          <span>Report</span>
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-500 text-sm">
              <AlertCircle className="h-4 w-4" />
              Report Review for Moderation
            </DialogTitle>
            <DialogDescription className="text-xs">
              Flag this review by {studentName || 'a campus student'} for administrator inspection. Reviews containing abusive language, harassment, or false information violate university policy.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <label htmlFor="report-reason" className="text-xs font-semibold text-foreground block">
              Reason for reporting
            </label>
            <Textarea
              id="report-reason"
              placeholder="Explain why this content violates guidelines (e.g. harassment, profanity, spam, off-topic)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="text-xs resize-none"
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={isSubmitting}
              className="text-xs font-semibold gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Submitting Report...
                </>
              ) : (
                <>
                  <Flag className="h-3.5 w-3.5" />
                  Submit Report
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

