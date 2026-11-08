'use client';

import * as React from 'react';
import Link from 'next/link';
import { Wrench, Plus, SearchX, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ServiceEmptyStateProps {
  type: 'no-services' | 'no-results';
  onResetFilters?: () => void;
  searchQuery?: string;
}

export function ServiceEmptyState({
  type,
  onResetFilters,
  searchQuery,
}: ServiceEmptyStateProps) {
  if (type === 'no-results') {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-card/50 p-8 sm:p-12 text-center backdrop-blur-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-4 shadow-sm">
          <SearchX className="h-8 w-8" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-foreground">
          No services matching criteria
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mt-1 mb-6">
          {searchQuery
            ? `No services found matching "${searchQuery}". Try adjusting your keywords or clearing selected filters.`
            : 'No services match the active category or status filter.'}
        </p>
        {onResetFilters && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="gap-2 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Search & Filters</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-b from-indigo-500/5 via-card/50 to-card p-8 sm:p-14 text-center backdrop-blur-xl shadow-lg shadow-indigo-500/5">
      <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 h-44 w-44 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white mb-5 shadow-xl shadow-indigo-500/20">
          <Wrench className="h-9 w-9 stroke-[2.2]" />
        </div>

        <h3 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
          You haven&apos;t listed any services yet
        </h3>

        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mt-2 mb-8 leading-relaxed">
          Start offering your campus services, equipment reservations, or laboratory sessions to students and
          department members. Define your price, capacity, and operational location.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link href="/provider/services/new">
            <Button variant="gradient" size="default" className="gap-2 text-xs sm:text-sm shadow-md shadow-indigo-500/20 px-6">
              <Plus className="h-4 w-4" />
              <span>Create Your First Service</span>
            </Button>
          </Link>

          <Link href="/provider/dashboard">
            <Button variant="outline" size="default" className="text-xs sm:text-sm">
              Return to Provider Desk
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
