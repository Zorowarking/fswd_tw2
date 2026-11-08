'use client';

import * as React from 'react';
import { SearchX, RotateCcw, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StudentServiceEmptyProps {
  type: 'no-results' | 'no-services';
  searchQuery?: string;
  onResetFilters: () => void;
}

export function StudentServiceEmpty({
  type,
  searchQuery,
  onResetFilters,
}: StudentServiceEmptyProps) {
  if (type === 'no-services') {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-b from-blue-500/5 via-card/50 to-card p-8 sm:p-14 text-center backdrop-blur-xl shadow-lg shadow-blue-500/5">
        <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 h-44 w-44 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white mb-5 shadow-xl shadow-blue-500/20">
            <Compass className="h-9 w-9 stroke-[2.2]" />
          </div>

          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            No Active Services Available Right Now
          </h3>

          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mt-2 mb-6 leading-relaxed">
            Campus service providers are currently configuring operational hours and queues.
            Please check back soon for hostel, sports, and laboratory reservations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-card/50 p-8 sm:p-14 text-center backdrop-blur-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-4 shadow-sm">
        <SearchX className="h-8 w-8 text-blue-500" />
      </div>

      <h3 className="text-base sm:text-lg font-bold text-foreground">
        No campus services match your criteria
      </h3>

      <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mt-1 mb-6 leading-relaxed">
        {searchQuery ? (
          <>
            We couldn&apos;t find any services matching &ldquo;{searchQuery}&rdquo;. Try searching for another keyword or removing active filters.
          </>
        ) : (
          'No services match the selected category or price tier. Try broadening your criteria.'
        )}
      </p>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onResetFilters}
        className="gap-2 text-xs border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span>Reset Search & Filters</span>
      </Button>
    </div>
  );
}
