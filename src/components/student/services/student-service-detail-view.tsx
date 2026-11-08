'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  Star,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CategoryIcon } from '@/components/categories/category-filter';
import { StudentBookingWidget } from './student-booking-widget';
import { ReportReviewDialog } from '@/components/reviews/report-review-dialog';
import type { StudentServiceDetail } from '@/app/actions/student-service-actions';

interface StudentServiceDetailViewProps {
  service: StudentServiceDetail;
}

export function StudentServiceDetailView({ service }: StudentServiceDetailViewProps) {
  const [imageError, setImageError] = React.useState(false);

  return (
    <div className="space-y-8">
      {/* 1. Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/student/services"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to All Campus Services</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {service.name}
            </h1>
            <Badge variant="glow" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
              ● Open for Booking
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Listed under <strong>{service.categoryName}</strong> • Managed by {service.providerName}
          </p>
        </div>
      </div>

      {/* 2. Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Service Media, Information, Specs, Provider, and Reviews */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero Image Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/70 backdrop-blur-sm shadow-md">
            <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-muted">
              {service.imageUrl && !imageError ? (
                <Image
                  src={service.imageUrl}
                  alt={service.name}
                  fill
                  unoptimized
                  className="object-cover"
                  priority
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-blue-950/40 via-card to-muted text-blue-400">
                  <CategoryIcon name={service.categoryIcon} className="h-20 w-20 stroke-[1.5]" />
                </div>
              )}

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

              {/* Floating Banner Badges */}
              <div className="absolute bottom-5 left-5 right-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 rounded-lg bg-black/50 px-2.5 py-1 text-xs font-semibold backdrop-blur-md">
                      <CategoryIcon name={service.categoryIcon} className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                      <span>{service.categoryName}</span>
                    </span>
                    {service.location && (
                      <span className="flex items-center gap-1.5 rounded-lg bg-black/50 px-2.5 py-1 text-xs font-semibold backdrop-blur-md">
                        <MapPin className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                        <span>{service.location}</span>
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black">{service.name}</h2>
                </div>

                <div className="flex items-center gap-3 bg-black/50 backdrop-blur-md rounded-2xl p-3 border border-white/10 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-gray-300">Rate per slot</span>
                    <p className="text-xl font-black text-white">
                      {service.price === 0 ? (
                        <span className="text-emerald-400">Free</span>
                      ) : (
                        `₹${service.price}`
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Card className="border-border/70 bg-card/70 backdrop-blur-sm p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Price</span>
                  <p className="text-base font-black text-foreground">
                    {service.price === 0 ? 'Free' : `₹${service.price}`}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-border/70 bg-card/70 backdrop-blur-sm p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Slot Duration</span>
                  <p className="text-base font-black text-foreground">
                    {service.durationMinutes} mins
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-border/70 bg-card/70 backdrop-blur-sm p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Capacity</span>
                  <p className="text-base font-black text-foreground">
                    {service.capacity} concurrent
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-border/70 bg-card/70 backdrop-blur-sm p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                  <Star className="h-5 w-5 fill-amber-500" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Rating</span>
                  <p className="text-base font-black text-foreground">
                    {service.rating > 0 ? `${service.rating} ★` : 'New'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Description Section */}
          <Card className="border-border/70 bg-card/70 backdrop-blur-sm">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-500" />
                <span>About this Service & Instructions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-2 space-y-4">
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {service.description ||
                  'No specific instructions provided. Please consult with the campus operations desk upon arrival.'}
              </p>

              {service.location && (
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-1">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-blue-500" />
                    Reporting Campus Location
                  </span>
                  <p className="text-xs text-muted-foreground">{service.location}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Provider Assurance Card */}
          <Card className="border-border/70 bg-card/70 backdrop-blur-sm">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-500" />
                <span>Service Provider Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border/60 bg-muted/20 p-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-base shadow-md shadow-blue-500/20">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-foreground">{service.providerName}</h4>
                      <Badge variant="glow" className="text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-400">
                        Verified
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Authorized campus service authority & facility desk
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                  {service.providerEmail && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span>{service.providerEmail}</span>
                    </span>
                  )}
                  {service.providerPhone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>{service.providerPhone}</span>
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ratings & Student Reviews */}
          <Card className="border-border/70 bg-card/70 backdrop-blur-sm">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span>Student Ratings & Feedback</span>
                </CardTitle>
                <Badge variant="outline" className="text-xs font-mono">
                  {service.reviewCount} {service.reviewCount === 1 ? 'verified review' : 'verified reviews'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-2 space-y-6">
              {service.reviewCount > 0 ? (
                <>
                  {/* Rating Overview Strip */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6 rounded-2xl border border-border/60 bg-muted/20 p-4">
                    <div className="flex flex-col items-center justify-center text-center sm:pr-6 sm:border-r border-border/60">
                      <span className="text-3xl sm:text-4xl font-black text-foreground">
                        {service.rating > 0 ? service.rating.toFixed(1) : '—'}
                      </span>
                      <div className="flex items-center gap-0.5 mt-1 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.round(service.rating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-muted-foreground/25'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-muted-foreground mt-1">
                        Based on {service.reviewCount} {service.reviewCount === 1 ? 'student booking' : 'student bookings'}
                      </span>
                    </div>

                    {/* Rating breakdown bars */}
                    <div className="flex-1 space-y-1.5 text-xs">
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = service.ratingBreakdown[stars as 1 | 2 | 3 | 4 | 5] || 0;
                        const pct = service.reviewCount > 0 ? (count / service.reviewCount) * 100 : 0;
                        return (
                          <div key={stars} className="flex items-center gap-2">
                            <span className="w-7 text-[11px] text-muted-foreground font-mono">{stars}★</span>
                            <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-amber-400 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-6 text-[10px] text-muted-foreground font-mono text-right">
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Reviews List */}
                  <div className="space-y-4">
                    {service.reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="rounded-2xl border border-border/60 bg-card/60 p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 font-bold text-xs">
                              {rev.studentName ? rev.studentName[0].toUpperCase() : 'S'}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-foreground">{rev.studentName}</p>
                              <span className="text-[10px] text-muted-foreground">{rev.createdAt}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 text-amber-400">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <Star
                                key={idx}
                                className={`h-3 w-3 ${
                                  idx < rev.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-muted-foreground/25'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {rev.comment || 'Verified campus booking completed successfully.'}
                        </p>
                        <div className="flex justify-end pt-0.5">
                          <ReportReviewDialog reviewId={rev.id} studentName={rev.studentName} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 p-8 text-center space-y-2.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mx-auto">
                    <Star className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">No Student Reviews Yet</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Verified ratings and feedback will be published here after students book and complete their service sessions.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Sticky Booking Widget */}
        <div className="space-y-6">
          <div className="sticky top-20">
            <StudentBookingWidget service={service} />
          </div>
        </div>
      </div>
    </div>
  );
}
