'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { Loader2, GraduationCap } from 'lucide-react';
import { resolveAuthRedirectAction } from '@/app/actions/role-actions';
import { invalidateClientRoleCache } from '@/hooks/use-user-role';

export function AuthRedirectClient() {
  const router = useRouter();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const [statusMessage, setStatusMessage] = React.useState('Routing to campus workspace...');

  React.useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.replace('/sign-in');
      return;
    }

    let isMounted = true;

    async function dispatchUser() {
      try {
        const clientData = {
          clerkUserId: userId || user?.id,
          email:
            user?.primaryEmailAddress?.emailAddress ||
            user?.emailAddresses?.[0]?.emailAddress ||
            undefined,
          name:
            user?.fullName ||
            [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
            undefined,
        };

        const result = await resolveAuthRedirectAction(clientData);

        if (!isMounted) return;

        invalidateClientRoleCache();

        if (result.redirectUrl) {
          router.replace(result.redirectUrl);
        } else {
          router.replace('/select-role');
        }
      } catch (err) {
        console.error('[AuthRedirectClient] Routing error:', err);
        if (isMounted) {
          setStatusMessage('Entering campus portal...');
          invalidateClientRoleCache();
          router.replace('/select-role');
        }
      }
    }

    void dispatchUser();

    return () => {
      isMounted = false;
    };
  }, [isLoaded, isSignedIn, userId, user, router]);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] w-full flex-col items-center justify-center px-4 py-12">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white shadow-lg shadow-blue-500/25 animate-pulse">
          <GraduationCap className="h-7 w-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            CampusServe Workspace
          </h2>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <span>{statusMessage}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

