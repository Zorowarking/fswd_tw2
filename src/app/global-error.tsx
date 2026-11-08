'use client';

import * as React from 'react';
import './globals.css';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-background text-foreground p-4 font-sans">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-6 shadow-2xl text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Critical System Error</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The root layout failed to initialize. Please refresh the browser or restart the session.
          </p>
          {error.digest && (
            <p className="font-mono text-xs text-muted-foreground">
              Digest: {error.digest}
            </p>
          )}
          <Button onClick={() => reset()} className="w-full gap-2">
            <RotateCcw className="h-4 w-4" />
            <span>Reload Application</span>
          </Button>
        </div>
      </body>
    </html>
  );
}
