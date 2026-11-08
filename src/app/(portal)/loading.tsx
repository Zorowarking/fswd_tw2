import * as React from 'react';

export default function PortalLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-pulse">
      {/* Top Header Skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-6">
        <div className="space-y-2">
          <div className="h-8 w-64 rounded-xl bg-muted/60" />
          <div className="h-4 w-96 rounded-lg bg-muted/40" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded-lg bg-muted/60" />
          <div className="h-9 w-28 rounded-lg bg-muted/60" />
        </div>
      </div>

      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl border border-border/60 bg-card/60 p-4 space-y-3">
            <div className="h-3 w-20 rounded bg-muted/50" />
            <div className="h-7 w-28 rounded bg-muted/70" />
            <div className="h-3 w-36 rounded bg-muted/40" />
          </div>
        ))}
      </div>

      {/* Main Table / Grid Skeleton */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6 space-y-4">
        <div className="flex justify-between items-center mb-4">
          <div className="h-5 w-40 rounded bg-muted/60" />
          <div className="h-6 w-20 rounded-full bg-muted/50" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 w-full rounded-xl bg-muted/30" />
          ))}
        </div>
      </div>
    </div>
  );
}

