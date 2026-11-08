'use client';

import * as React from 'react';
import Link from 'next/link';
import { RotateCcw, LayoutDashboard, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PortalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PortalErrorBoundary({ error, reset }: PortalErrorProps) {
  React.useEffect(() => {
    console.error('[CampusServe Portal Error Boundary]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4 sm:p-8">
      <Card className="max-w-md w-full border-border/80 shadow-xl bg-card/90 backdrop-blur-md">
        <CardHeader className="text-center space-y-3 pb-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20 shadow-inner">
            <ShieldAlert className="h-7 w-7" />
          </div>

          <Badge variant="destructive" className="mx-auto text-[10px] font-semibold tracking-wider uppercase">
            Portal View Error
          </Badge>

          <CardTitle className="text-xl font-bold text-foreground">
            Something went wrong
          </CardTitle>

          <CardDescription className="text-xs text-muted-foreground leading-relaxed">
            We couldn&apos;t load this portal section. This may be due to a temporary network blip or an authentication session refresh.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 pt-2">
          {error.digest && (
            <div className="rounded-xl border border-border/60 bg-muted/40 p-3 text-center">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                Telemetry Digest
              </span>
              <code className="text-xs font-mono text-foreground/80 font-bold">
                {error.digest}
              </code>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-border/50">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => reset()}
            className="w-full gap-2 text-xs font-semibold rounded-xl"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </Button>

          <Button
            asChild
            size="sm"
            className="w-full gap-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground"
          >
            <Link href="/dashboard">
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
