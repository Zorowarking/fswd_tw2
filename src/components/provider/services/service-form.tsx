'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Wrench,
  DollarSign,
  Clock,
  Users,
  MapPin,
  Sparkles,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ServiceImagePicker } from './service-image-picker';
import { CategoryIcon } from '@/components/categories/category-filter';
import {
  serviceSchema,
  type ServiceFormData,
} from '@/lib/validations/service';
import {
  createService,
  updateService,
  type ServiceCategoryOption,
} from '@/app/actions/service-actions';
import { toast } from 'sonner';

interface ServiceFormProps {
  categories: ServiceCategoryOption[];
  mode: 'create' | 'edit';
  serviceId?: string;
  initialData?: Partial<ServiceFormData>;
}

const QUICK_DURATIONS = [
  { label: '15m', value: 15 },
  { label: '30m', value: 30 },
  { label: '45m', value: 45 },
  { label: '60m (1h)', value: 60 },
  { label: '90m', value: 90 },
  { label: '120m (2h)', value: 120 },
  { label: '180m (3h)', value: 180 },
  { label: '240m (4h)', value: 240 },
];

export function ServiceForm({
  categories,
  mode,
  serviceId,
  initialData,
}: ServiceFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form State
  const [formData, setFormData] = React.useState<ServiceFormData>({
    name: initialData?.name || '',
    categoryId: initialData?.categoryId || (categories[0]?.id || ''),
    price: initialData?.price ?? 0,
    durationMinutes: initialData?.durationMinutes ?? 30,
    capacity: initialData?.capacity ?? 1,
    location: initialData?.location || '',
    description: initialData?.description || '',
    imageUrl: initialData?.imageUrl || '',
    isActive: initialData?.isActive ?? true,
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validateField = (field: keyof ServiceFormData, value: unknown) => {
    const partialData = { ...formData, [field]: value };
    const result = serviceSchema.safeParse(partialData);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === field);
      if (issue) {
        setErrors((prev) => ({ ...prev, [field]: issue.message }));
        return;
      }
    }
    // Clear error if valid
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate entire form with Zod
    const validation = serviceSchema.safeParse(formData);
    if (!validation.success) {
      const formattedErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const path = issue.path[0] as string;
        if (!formattedErrors[path]) {
          formattedErrors[path] = issue.message;
        }
      }
      setErrors(formattedErrors);
      toast.error('Please resolve the errors highlighted below.');
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      if (mode === 'create') {
        const res = await createService(validation.data);
        if (!res.success) {
          toast.error(res.error || 'Failed to create service.');
          setIsSubmitting(false);
          return;
        }

        toast.success(`Service "${res.data?.name || formData.name}" created successfully!`);
        router.push(res.data?.id ? `/provider/services/${res.data.id}` : '/provider/services');
        router.refresh();
      } else {
        if (!serviceId) throw new Error('Service ID missing for edit mode');
        const res = await updateService(serviceId, validation.data);
        if (!res.success) {
          toast.error(res.error || 'Failed to update service.');
          setIsSubmitting(false);
          return;
        }

        toast.success(`Service "${res.data?.name || formData.name}" updated successfully!`);
        router.push(`/provider/services/${serviceId}`);
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      toast.error(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href={mode === 'edit' && serviceId ? `/provider/services/${serviceId}` : '/provider/services'}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to {mode === 'edit' ? 'Service Details' : 'My Services'}</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {mode === 'create' ? 'List a New Campus Service' : `Edit: ${initialData?.name || 'Service'}`}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {mode === 'create'
              ? 'Configure service parameters, operational availability, location, and capacity for campus booking.'
              : 'Update service details, pricing, capacity, and catalog visibility.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={mode === 'edit' && serviceId ? `/provider/services/${serviceId}` : '/provider/services'}
          >
            <Button type="button" variant="outline" size="sm" disabled={isSubmitting} className="text-xs">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="gradient"
            size="sm"
            disabled={isSubmitting}
            className="text-xs gap-1.5 shadow-md shadow-indigo-500/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{mode === 'create' ? 'Creating Service...' : 'Saving Changes...'}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{mode === 'create' ? 'Publish Service' : 'Save Changes'}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column: Core Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Basic Information */}
          <Card className="border-border/70 bg-card/70 backdrop-blur-sm">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Wrench className="h-4 w-4 text-indigo-500" />
                <span>Service Basics</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Essential identification details displayed to students in the directory.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-2 space-y-4">
              {/* Service Name */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="name" className="text-xs font-semibold text-foreground">
                    Service Name <span className="text-rose-500">*</span>
                  </Label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {formData.name.length}/100
                  </span>
                </div>
                <Input
                  id="name"
                  placeholder="e.g. Advanced Chemistry Spectroscopy Analysis or Hostel Express Laundry"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, name: e.target.value }));
                    validateField('name', e.target.value);
                  }}
                  className={`text-sm ${errors.name ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                />
                {errors.name && (
                  <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Category Assignment */}
              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-xs font-semibold text-foreground">
                  Assign Category <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(val) => {
                    setFormData((prev) => ({ ...prev, categoryId: val }));
                    validateField('categoryId', val);
                  }}
                >
                  <SelectTrigger
                    id="category"
                    className={`text-xs ${errors.categoryId ? 'border-rose-500' : ''}`}
                  >
                    <SelectValue placeholder="Select a campus service category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className="text-xs">
                        <div className="flex items-center gap-2">
                          <CategoryIcon name={cat.icon} className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          <span>{cat.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && (
                  <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {errors.categoryId}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description" className="text-xs font-semibold text-foreground">
                    Description & Instructions
                  </Label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {formData.description?.length || 0}/2000
                  </span>
                </div>
                <Textarea
                  id="description"
                  rows={4}
                  placeholder="Describe what this service covers, student prerequisites, safety requirements, what materials to bring, turnaround time, etc."
                  value={formData.description || ''}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, description: e.target.value }));
                    validateField('description', e.target.value);
                  }}
                  className={`text-xs resize-y ${errors.description ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                />
                {errors.description && (
                  <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {errors.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Pricing, Duration & Capacity */}
          <Card className="border-border/70 bg-card/70 backdrop-blur-sm">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                <span>Pricing, Capacity & Time Allocation</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Define the fee structure, operational capacity, and slot duration.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-2 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Price */}
                <div className="space-y-1.5">
                  <Label htmlFor="price" className="text-xs font-semibold text-foreground">
                    Price (INR ₹) <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                      ₹
                    </span>
                    <Input
                      id="price"
                      type="number"
                      step="1"
                      min="0"
                      max="500000"
                      placeholder="0"
                      value={formData.price}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setFormData((prev) => ({ ...prev, price: val }));
                        validateField('price', val);
                      }}
                      className={`pl-7 text-sm font-mono ${errors.price ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Enter 0 for free campus services</p>
                  {errors.price && (
                    <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {errors.price}
                    </p>
                  )}
                </div>

                {/* Capacity */}
                <div className="space-y-1.5">
                  <Label htmlFor="capacity" className="text-xs font-semibold text-foreground">
                    Concurrent Capacity <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      max="1000"
                      placeholder="1"
                      value={formData.capacity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 1;
                        setFormData((prev) => ({ ...prev, capacity: val }));
                        validateField('capacity', val);
                      }}
                      className={`pl-8 text-sm font-mono ${errors.capacity ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Max simultaneous bookings/seats</p>
                  {errors.capacity && (
                    <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {errors.capacity}
                    </p>
                  )}
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                  <Label htmlFor="duration" className="text-xs font-semibold text-foreground">
                    Slot Duration (Minutes) <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="duration"
                      type="number"
                      min="5"
                      max="1440"
                      step="5"
                      placeholder="30"
                      value={formData.durationMinutes}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 30;
                        setFormData((prev) => ({ ...prev, durationMinutes: val }));
                        validateField('durationMinutes', val);
                      }}
                      className={`pl-8 text-sm font-mono ${errors.durationMinutes ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Standard appointment length</p>
                  {errors.durationMinutes && (
                    <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {errors.durationMinutes}
                    </p>
                  )}
                </div>
              </div>

              {/* Duration Quick Presets */}
              <div className="space-y-1.5 pt-1 border-t border-border/50">
                <span className="text-[11px] font-medium text-muted-foreground">Quick Duration Pick:</span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_DURATIONS.map((dur) => (
                    <button
                      key={dur.value}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, durationMinutes: dur.value }));
                        validateField('durationMinutes', dur.value);
                      }}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        formData.durationMinutes === dur.value
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'border border-border/70 bg-card hover:bg-muted text-foreground'
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Location */}
          <Card className="border-border/70 bg-card/70 backdrop-blur-sm">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-purple-500" />
                <span>Operational Campus Location</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Where students will report or pick up their service on campus.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-2 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-xs font-semibold text-foreground">
                  Location & Room Details <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="e.g. Science Block 3, Ground Floor Room 104, West Campus"
                    value={formData.location}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, location: e.target.value }));
                      validateField('location', e.target.value);
                    }}
                    className={`pl-8 text-sm ${errors.location ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Provide building name, wing, room number, or landmark to guide students easily.
                </p>
                {errors.location && (
                  <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {errors.location}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Column: Service Image & Visibility Status */}
        <div className="space-y-6">
          {/* Service Image Card */}
          <Card className="border-border/70 bg-card/70 backdrop-blur-sm">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                <span>Service Cover Image</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Upload or select an attractive image representing this service.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              <ServiceImagePicker
                value={formData.imageUrl || ''}
                onChange={(url) => {
                  setFormData((prev) => ({ ...prev, imageUrl: url }));
                  validateField('imageUrl', url);
                }}
              />
              {errors.imageUrl && (
                <p className="text-xs text-rose-500 flex items-center gap-1 mt-2">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {errors.imageUrl}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Visibility / Status Card */}
          <Card className="border-border/70 bg-card/70 backdrop-blur-sm">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Catalog Status</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Control whether this service is discoverable and bookable.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-2 space-y-4">
              <div
                onClick={() => setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))}
                className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition-all ${
                  formData.isActive
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-border/60 bg-muted/20'
                }`}
              >
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground">
                    {formData.isActive ? 'Active (Accepting Bookings)' : 'Inactive (Hidden)'}
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    {formData.isActive
                      ? 'Service is visible in student catalog and booking slots are open.'
                      : 'Service is paused; students cannot place new booking orders.'}
                  </p>
                </div>
                <div
                  className={`h-6 w-11 rounded-full p-1 transition-colors ${
                    formData.isActive ? 'bg-emerald-600' : 'bg-muted'
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full bg-white transition-transform ${
                      formData.isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

              {/* Ownership notice */}
              <div className="rounded-xl border border-border/60 bg-card/40 p-3 text-[11px] text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Provider Ownership</p>
                <p>
                  This service is exclusively registered under your authorized provider account. Only you can
                  edit specs, accept work orders, or manage availability.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
