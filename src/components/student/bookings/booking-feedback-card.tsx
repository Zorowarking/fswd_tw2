'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Star, MessageSquare, Loader2, CheckCircle2, Lock } from 'lucide-react';
import { submitBookingFeedbackAction, type BookingTrackingDetails } from '@/app/actions/booking-actions';
import { toast } from 'sonner';

interface BookingFeedbackCardProps {
  booking: BookingTrackingDetails;
}

export function BookingFeedbackCard({ booking }: BookingFeedbackCardProps) {
  const router = useRouter();
  const [rating, setRating] = React.useState<number>(5);
  const [hoverRating, setHoverRating] = React.useState<number>(0);
  const [comment, setComment] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isCompleted = booking.status === 'COMPLETED';
  const hasFeedback = booking.feedback?.hasFeedback;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      toast.error('Please choose a star rating (1-5).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitBookingFeedbackAction({
        bookingId: booking.id,
        rating,
        comment: comment.trim() || undefined,
      });

      if (!res.success) {
        toast.error(res.error || 'Failed to submit feedback.');
        setIsSubmitting(false);
        return;
      }

      toast.success('Thank you! Your feedback has been recorded.');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error submitting review.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-border/80 shadow-sm overflow-hidden">
      <CardHeader className="p-5 pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Service Feedback & Rating
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Share your experience with {booking.service.name} and {booking.provider.name}.
          </p>
        </div>

        {hasFeedback && (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs font-semibold">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Feedback Submitted
          </Badge>
        )}
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {hasFeedback ? (
          /* Existing feedback display */
          <div className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= (booking.feedback?.rating || 0)
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-muted stroke-muted-foreground'
                    }`}
                  />
                ))}
                <span className="text-xs font-bold text-foreground ml-2">
                  {booking.feedback?.rating}.0 / 5.0
                </span>
              </div>

              {booking.feedback?.submittedAt && (
                <span className="text-[11px] text-muted-foreground font-medium">
                  {booking.feedback.submittedAt}
                </span>
              )}
            </div>

            {booking.feedback?.comment ? (
              <p className="text-xs text-foreground italic leading-relaxed">
                &ldquo;{booking.feedback.comment}&rdquo;
              </p>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Rated with no written review.
              </p>
            )}
          </div>
        ) : isCompleted ? (
          /* Interactive submission form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                How was your experience?
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 rounded hover:scale-110 transition-transform focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 transition-colors ${
                        star <= (hoverRating || rating)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-foreground ml-2">
                  {rating} of 5 Stars
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="review-comment" className="text-xs font-semibold text-foreground block">
                Comments or Suggestions (optional)
              </label>
              <Textarea
                id="review-comment"
                placeholder="Share helpful notes about the facility cleanliness, staff support, speed, or quality..."
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={isSubmitting}
                className="text-xs resize-none"
              />
            </div>

            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Submitting Feedback...
                </>
              ) : (
                'Submit Review'
              )}
            </Button>
          </form>
        ) : (
          /* Locked until session concludes */
          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-dashed border-border/70 text-xs text-muted-foreground">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <span className="font-semibold text-foreground block">Feedback Locked</span>
              <p className="mt-0.5">
                You will be invited to leave a review and star rating once the service session is
                marked completed by the provider.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
