'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Award, ThumbsUp, Quote } from 'lucide-react';
import type { RatingAnalytics } from '@/app/actions/admin-analytics-actions';

interface RatingsAnalyticsCardProps {
  ratings: RatingAnalytics;
}

export function RatingsAnalyticsCard({ ratings }: RatingsAnalyticsCardProps) {
  const { average, totalCount, starBreakdown, categoryRatings, recentReviews } =
    ratings;

  return (
    <Card className="bg-card/85 backdrop-blur-md border-border/80 shadow-sm overflow-hidden">
      <CardHeader className="p-4 sm:p-6 pb-2 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span>Campus Service Satisfaction & Ratings</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Aggregated feedback ratings and student sentiment across all completed bookings
            </CardDescription>
          </div>
          <Badge variant="glow" className="text-[11px] font-semibold gap-1">
            <Award className="h-3 w-3 text-amber-500" />
            <span>{totalCount} Verified Reviews</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 pt-4 space-y-6">
        {/* Rating Score & Star Histogram */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Big Score Callout */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 text-center">
            <span className="text-5xl font-black text-amber-500 font-mono tracking-tight">
              {average > 0 ? average.toFixed(1) : '—'}
            </span>
            <div className="flex items-center gap-1 my-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= Math.round(average)
                      ? 'text-amber-500 fill-amber-500'
                      : 'text-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-foreground">
              Overall Campus Average
            </span>
            <span className="text-[11px] text-muted-foreground mt-0.5">
              Based on {totalCount} post-service submissions
            </span>
          </div>

          {/* 5-Star Histogram */}
          <div className="md:col-span-2 space-y-2">
            {starBreakdown.map((row) => (
              <div key={row.stars} className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1 w-12 font-semibold text-muted-foreground shrink-0">
                  <span>{row.stars}</span>
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                </div>

                <div className="flex-1 h-2.5 rounded-full bg-muted/60 overflow-hidden">
                  <div
                    style={{ width: `${row.percentage}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                  />
                </div>

                <div className="w-16 text-right font-mono text-[11px] shrink-0">
                  <span className="font-bold text-foreground">{row.count}</span>
                  <span className="text-muted-foreground ml-1">
                    ({row.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Ratings Breakdown */}
        {categoryRatings.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-border/50">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <ThumbsUp className="h-3.5 w-3.5 text-blue-500" />
                <span>Rating Breakdown by Service Category</span>
              </span>
              <span className="text-[11px] text-muted-foreground">
                Average across categories
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {categoryRatings.map((cat) => (
                <div
                  key={cat.category}
                  className="p-2.5 rounded-xl border border-border/50 bg-muted/20 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-foreground truncate max-w-[120px]">
                    {cat.category}
                  </span>
                  <div className="flex items-center gap-1 font-bold text-amber-500 font-mono">
                    <Star className="h-3 w-3 fill-amber-500" />
                    <span>{cat.averageRating}</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      ({cat.reviewCount})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Student Feedback Quotes */}
        {recentReviews.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-border/50">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Quote className="h-3.5 w-3.5 text-purple-500" />
                <span>Recent Verified Student Feedback</span>
              </span>
              <span className="text-[11px] text-muted-foreground">
                Latest submissions
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recentReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3 rounded-xl border border-border/40 bg-muted/20 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground truncate max-w-[150px]">
                      {rev.studentName}
                    </span>
                    <div className="flex items-center gap-1 text-amber-500 font-bold font-mono text-[11px]">
                      <Star className="h-3 w-3 fill-amber-500" />
                      <span>{rev.rating}★</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground block truncate">
                    {rev.serviceName} • {rev.formattedDate}
                  </span>
                  {rev.comment && (
                    <p className="text-xs text-muted-foreground line-clamp-2 italic">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
