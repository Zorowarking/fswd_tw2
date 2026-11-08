'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Wrench,
  ArrowLeft,
  Edit2,
  Trash2,
  Power,
  MapPin,
  Clock,
  Users,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  CalendarDays,
  CalendarClock,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { ServiceDeleteDialog } from './service-delete-dialog';
import { ServiceStatusDialog } from './service-status-dialog';
import { ReportReviewDialog } from '@/components/reviews/report-review-dialog';
import { CategoryIcon } from '@/components/categories/category-filter';
import {
  type ProviderServiceDetail,
  toggleServiceStatus,
  deleteService,
} from '@/app/actions/service-actions';
import { toast } from 'sonner';

interface ServiceDetailViewProps {
  initialService: ProviderServiceDetail;
}

export function ServiceDetailView({ initialService }: ServiceDetailViewProps) {
  const router = useRouter();
  const [service, setService] = React.useState<ProviderServiceDetail>(initialService);

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = React.useState(false);

  const handleConfirmToggle = async (serviceId: string) => {
    const res = await toggleServiceStatus(serviceId);
    if (!res.success) {
      toast.error(res.error || 'Failed to update service status');
      return;
    }

    setService((prev) => ({
      ...prev,
      isActive: res.data?.isActive ?? !prev.isActive,
    }));

    toast.success(
      res.data?.isActive ? 'Service activated and listed on catalog' : 'Service deactivated and hidden from students'
    );
  };

  const handleConfirmDelete = async (serviceId: string) => {
    const res = await deleteService(serviceId);
    if (!res.success) {
      toast.error(res.error || 'Failed to delete service');
      return;
    }

    toast.success('Service permanently deleted');
    router.push('/provider/services');
    router.refresh();
  };

  const formattedCreatedDate = new Date(service.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-8">
      {/* 1. Breadcrumbs & Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/provider/services"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to My Services</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {service.name}
            </h1>
            <Badge
              variant={service.isActive ? 'glow' : 'outline'}
              className="text-xs uppercase font-bold"
            >
              {service.isActive ? '● Active' : '○ Inactive'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Listed under <strong>{service.categoryName}</strong> • Created on {formattedCreatedDate}
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/provider/availability?serviceId=${service.id}`}>
            <Button
              size="sm"
              className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
            >
              <CalendarClock className="h-3.5 w-3.5" />
              <span>Manage Availability & Calendar</span>
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (service.isActive) {
                setStatusDialogOpen(true);
              } else {
                handleConfirmToggle(service.id);
              }
            }}
            className="text-xs gap-1.5"
          >
            <Power className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{service.isActive ? 'Deactivate' : 'Activate'}</span>
          </Button>

          <Link href={`/provider/services/${service.id}/edit`}>
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <Edit2 className="h-3.5 w-3.5" />
              <span>Edit Service</span>
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            className="text-xs gap-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* 2. Hero Image Banner & Primary Specs */}
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/70 backdrop-blur-sm shadow-md">
        <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-muted">
          {service.imageUrl ? (
            <Image
              src={service.imageUrl}
              alt={service.name}
              fill
              unoptimized
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-indigo-950/40 to-muted text-indigo-400">
              <CategoryIcon name={service.categoryIcon} className="h-20 w-20 stroke-[1.5]" />
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

          {/* Badges on Banner */}
          <div className="absolute bottom-5 left-5 right-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-lg bg-black/50 px-2.5 py-1 text-xs font-semibold backdrop-blur-md">
                  <CategoryIcon name={service.categoryIcon} className="h-3.5 w-3.5 text-indigo-400" />
                  <span>{service.categoryName}</span>
                </span>
                <span className="flex items-center gap-1.5 rounded-lg bg-black/50 px-2.5 py-1 text-xs font-semibold backdrop-blur-md">
                  <MapPin className="h-3.5 w-3.5 text-purple-400" />
                  <span>{service.location || 'Campus Location Unspecified'}</span>
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black">{service.name}</h2>
            </div>

            <div className="flex items-center gap-3 bg-black/50 backdrop-blur-md rounded-2xl p-3 border border-white/10 shrink-0">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-gray-300">Booking Price</span>
                <p className="text-xl font-black text-white">
                  {service.price > 0 ? `₹${service.price}` : 'Free'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Specs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border/70 bg-card/70 backdrop-blur-sm p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Price</span>
              <p className="text-lg font-black text-foreground">
                {service.price > 0 ? `₹${service.price}` : 'Free'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-border/70 bg-card/70 backdrop-blur-sm p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Slot Duration</span>
              <p className="text-lg font-black text-foreground">
                {service.durationMinutes} mins
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-border/70 bg-card/70 backdrop-blur-sm p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Capacity</span>
              <p className="text-lg font-black text-foreground">
                {service.capacity} concurrent
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-border/70 bg-card/70 backdrop-blur-sm p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Total Bookings</span>
              <p className="text-lg font-black text-foreground">
                {service.totalBookings}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column: Description & Bookings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description Card */}
          <Card className="border-border/70 bg-card/70 backdrop-blur-sm">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Wrench className="h-4 w-4 text-indigo-500" />
                <span>Service Description & Terms</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {service.description ||
                  'No description has been provided for this service. Click Edit Service to add comprehensive student guidelines and instructions.'}
              </p>
            </CardContent>
          </Card>

          {/* Bookings Activity */}
          <Card className="border-border/70 bg-card/70 backdrop-blur-sm overflow-hidden">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-purple-500" />
                    <span>Recent Service Bookings</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Students who have reserved or booked this specific service.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  {service.activeBookings} active orders
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {service.recentBookings.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs">
                  No bookings have been scheduled for this service yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/60 hover:bg-transparent">
                      <TableHead>Order Code</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Scheduled Slot</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {service.recentBookings.map((b) => (
                      <TableRow key={b.id} className="border-border/50 hover:bg-muted/30">
                        <TableCell className="font-mono text-xs font-semibold text-foreground">
                          {b.bookingCode}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-medium text-foreground">{b.studentName}</div>
                          <div className="text-[10px] text-muted-foreground">{b.studentEmail}</div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <div>
                            {new Date(b.scheduledAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                          <div className="text-[10px] font-mono">{b.slotTime || 'Standard'}</div>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-foreground">
                          {b.amount > 0 ? `₹${b.amount}` : 'Free'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {b.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Student Ratings & Feedback Section */}
          <Card className="border-border/70 bg-card/70 backdrop-blur-sm">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span>Student Ratings & Feedback</span>
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Verified feedback from students who completed bookings for this service.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">
                    {service.reviewsSummary.totalReviews}{' '}
                    {service.reviewsSummary.totalReviews === 1 ? 'review' : 'reviews'}
                  </Badge>
                  {service.reviewsSummary.totalReviews > 0 && (
                    <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-xs font-bold gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      {service.reviewsSummary.averageRating.toFixed(1)} / 5.0
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              {service.reviews && service.reviews.length > 0 ? (
                <div className="space-y-3">
                  {service.reviews.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs">
                            {r.studentName ? r.studentName[0].toUpperCase() : 'S'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-foreground">{r.studentName}</p>
                              <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 h-4">
                                {r.bookingCode}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground">{r.studentEmail}</p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-0.5 text-amber-400">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <Star
                                key={idx}
                                className={`h-3.5 w-3.5 ${
                                  idx < r.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-muted-foreground/25'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-muted-foreground">{r.createdAt}</span>
                        </div>
                      </div>

                      {r.comment ? (
                        <p className="text-xs text-foreground italic leading-relaxed pl-1 border-l-2 border-primary/30">
                          &ldquo;{r.comment}&rdquo;
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic pl-1">
                          Rated without written feedback.
                        </p>
                      )}

                      <div className="flex justify-end pt-1">
                        <ReportReviewDialog reviewId={r.id} studentName={r.studentName} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border/70 p-8 text-center space-y-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 mx-auto">
                    <Star className="h-5 w-5" />
                  </div>
                  <h4 className="text-xs font-bold text-foreground">No Student Reviews Yet</h4>
                  <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                    Student reviews and ratings will be recorded here once reservations for this service are marked as completed.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Column: Deletion Status & Ownership Assurance */}
        <div className="space-y-6">
          {/* Operating Schedule & Availability Card */}
          <Card className="border-border/70 bg-card/70 backdrop-blur-sm">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-blue-500" />
                <span>Operating Schedule & Availability</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-2 space-y-3 text-xs">
              <p className="text-muted-foreground leading-relaxed">
                Configure weekly hours, slot capacity ({service.capacity} concurrent), and block dates or unavailable maintenance periods.
              </p>
              <Link href={`/provider/availability?serviceId=${service.id}`} className="block">
                <Button size="sm" variant="outline" className="w-full text-xs gap-1.5 border-blue-500/30 text-blue-500 hover:bg-blue-500/10">
                  <CalendarClock className="h-3.5 w-3.5" />
                  <span>Open Availability Calendar</span>
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Deletion Eligibility Audit */}
          <Card className="border-border/70 bg-card/70 backdrop-blur-sm">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <AlertTriangle
                  className={`h-4 w-4 ${service.canDelete ? 'text-emerald-500' : 'text-amber-500'}`}
                />
                <span>Deletion Policy Status</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Audit and system safety check for service removal.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-2 space-y-3">
              {service.canDelete ? (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-700 dark:text-emerald-400 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Eligible for Deletion
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    This service has no active or past bookings. It can be safely deleted.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    Deletion Restricted
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    {service.deleteRestrictionReason}
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-border/50 bg-muted/20 p-3 text-[11px] text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Campus Safety Guarantee</p>
                <p>
                  Services with active or past student transactions cannot be hard-deleted to prevent broken
                  audit trails. Providers can safely deactivate services at any time.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Location & Provider Ownership */}
          <Card className="border-border/70 bg-card/70 backdrop-blur-sm">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-indigo-500" />
                <span>Authorized Provider</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-2 space-y-3 text-xs">
              <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/50 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs">
                  <Wrench className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-foreground truncate">{service.providerName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{service.providerEmail}</p>
                </div>
              </div>

              <div className="space-y-1 text-muted-foreground text-[11px]">
                <p>
                  <strong>Service ID:</strong> <span className="font-mono">{service.id}</span>
                </p>
                <p>
                  <strong>Last Updated:</strong>{' '}
                  {new Date(service.updatedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ServiceDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        service={service}
        onConfirmDelete={handleConfirmDelete}
        onDeactivateInstead={async (serviceId) => {
          await handleConfirmToggle(serviceId);
        }}
      />

      <ServiceStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        service={service}
        onConfirmToggle={handleConfirmToggle}
      />
    </div>
  );
}
