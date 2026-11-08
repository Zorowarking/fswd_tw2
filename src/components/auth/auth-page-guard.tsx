'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';

export function AuthPageGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  React.useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/auth-redirect');
    }
  }, [isLoaded, isSignedIn, router]);

  if (isLoaded && isSignedIn) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground animate-pulse">
          Active session found. Redirecting to your campus workspace...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

