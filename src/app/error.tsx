'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { APP_CONFIG } from '@/lib/constants';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  React.useEffect(() => {
    // Log unexpected runtime error to console for diagnostic review
    console.error('[CampusServe Error Boundary]', error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full border-border/80 shadow-2xl bg-card/80 backdrop-blur-xl">
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 shadow-inner">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <Badge variant="destructive" className="mx-auto text-[10px]">
            System Execution Interrupted
          </Badge>
          <CardTitle className="text-xl font-bold">
            An Unexpected Error Occurred
          </CardTitle>
          <CardDescription className="text-xs">
            The requested campus service view encountered a runtime exception. Our incident telemetry has been alerted.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 pt-2">
          {error.digest && (
            <div className="rounded-xl border border-border/60 bg-muted/40 p-3 text-center">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                Error Reference Digest
              </span>
              <code className="text-xs font-mono text-foreground font-bold">
                {error.digest}
              </code>
            </div>
          )}

          <div className="text-[11px] text-muted-foreground text-center">
            Need urgent assistance? Contact{' '}
            <span className="text-foreground font-semibold">{APP_CONFIG.emergencyDesk}</span>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            variant="default"
            className="w-full gap-2 text-xs"
            onClick={() => reset()}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </Button>
          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full gap-2 text-xs">
              <Home className="h-3.5 w-3.5" />
              <span>Campus Home</span>
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
