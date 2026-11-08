'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  MapPin,
  Clock,
  Users,
  Star,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CategoryIcon } from '@/components/categories/category-filter';
import type { StudentServiceItem } from '@/app/actions/student-service-actions';

interface StudentServiceCardProps {
  service: StudentServiceItem;
}

export function StudentServiceCard({ service }: StudentServiceCardProps) {
  const [imageError, setImageError] = React.useState(false);

  return (
    <Card className="group flex flex-col overflow-hidden rounded-2xl border-border/70 bg-card/70 backdrop-blur-sm transition-all duration-300 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5">
      {/* 1. Cover Image & Badges */}
      <div className="relative h-48 w-full overflow-hidden bg-muted">
        {service.imageUrl && !imageError ? (
          <Image
            src={service.imageUrl}
            alt={service.name}
            fill
            unoptimized
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-blue-950/40 via-card to-muted text-blue-400">
            <CategoryIcon name={service.categoryIcon} className="h-14 w-14 stroke-[1.5]" />
          </div>
        )}

        {/* Gradient Overlay for Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

        {/* Category Badge (Top Left) */}
        <div className="absolute left-3 top-3">
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 rounded-lg border-white/20 bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md shadow-sm"
          >
            <CategoryIcon name={service.categoryIcon} className="h-3 w-3 text-blue-400 shrink-0" />
            <span>{service.categoryName}</span>
          </Badge>
        </div>

        {/* Price Tag (Top Right) */}
        <div className="absolute right-3 top-3">
          <div className="flex items-center rounded-lg border border-white/20 bg-black/60 px-2.5 py-1 text-xs font-black text-white backdrop-blur-md shadow-sm">
            {service.price === 0 ? (
              <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                FREE
              </span>
            ) : (
              <span>₹{service.price}</span>
            )}
          </div>
        </div>

        {/* Provider Tag (Bottom Left over Image) */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-1.5 text-xs font-medium text-white/90 drop-shadow-sm truncate">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-400 shrink-0" />
            <span className="truncate">{service.providerName}</span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 rounded-md bg-black/50 px-2 py-0.5 text-[11px] font-bold backdrop-blur-md shrink-0">
            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
            {service.rating > 0 ? (
              <span>
                {service.rating}{' '}
                <span className="font-normal text-white/70">({service.reviewCount})</span>
              </span>
            ) : (
              <span className="text-amber-300 font-semibold text-[10px]">NEW</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Card Content */}
      <div className="flex flex-1 flex-col p-4 space-y-3.5">
        <div>
          <Link href={`/student/services/${service.id}`} className="block">
            <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-blue-500 transition-colors line-clamp-1">
              {service.name}
            </h3>
          </Link>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
            {service.description || 'Verified university service available for campus bookings.'}
          </p>
        </div>

        {/* Location */}
        {service.location && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-500" />
            <span className="truncate">{service.location}</span>
          </div>
        )}

        {/* Specifications Strip: Duration & Capacity */}
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/60 bg-muted/20 p-2 text-center text-xs mt-auto">
          <div className="flex items-center justify-center gap-1 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span className="font-mono">{service.durationMinutes}m slots</span>
          </div>
          <div className="flex items-center justify-center gap-1 border-l border-border/60 text-muted-foreground">
            <Users className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            <span className="font-mono">Cap: {service.capacity}</span>
          </div>
        </div>

        {/* Footer: Price & Book Button */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Rate</span>
            <p className="text-base font-black text-foreground">
              {service.price === 0 ? (
                <span className="text-emerald-500">Free Reservation</span>
              ) : (
                `₹${service.price}`
              )}
            </p>
          </div>

          <Link href={`/student/services/${service.id}`}>
            <Button
              size="sm"
              variant="default"
              className="h-8 px-3 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20"
            >
              <span>Book Slot</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

