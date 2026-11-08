'use client';

import * as React from 'react';
import { useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';

export type UserRoleType = 'STUDENT' | 'SERVICE_PROVIDER' | 'ADMIN' | null;

// Module-level client cache across soft navigations
let cachedClientRole: UserRoleType = null;
let cachedForUserId: string | null = null;
let cachedRoleFetched = false;

export function invalidateClientRoleCache() {
  cachedClientRole = null;
  cachedForUserId = null;
  cachedRoleFetched = false;
}

export function useUserRole() {
  const { isSignedIn, isLoaded, user } = useUser();
  const pathname = usePathname();

  // Fast-path inference derived directly from current path
  let pathRole: UserRoleType = null;
  if (pathname.startsWith('/student')) {
    pathRole = 'STUDENT';
  } else if (pathname.startsWith('/provider')) {
    pathRole = 'SERVICE_PROVIDER';
  } else if (pathname.startsWith('/admin')) {
    pathRole = 'ADMIN';
  }

  const [apiRole, setApiRole] = React.useState<UserRoleType>(() => {
    if (pathRole) return pathRole;
    if (user?.id && cachedForUserId === user.id && cachedRoleFetched) return cachedClientRole;
    return null;
  });

  const effectiveRole =
    pathRole || (user?.id && cachedForUserId === user.id && cachedRoleFetched ? cachedClientRole : apiRole);
  const isAuthPage = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');

  React.useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) {
      cachedClientRole = null;
      cachedForUserId = null;
      cachedRoleFetched = false;
      return;
    }

    if (pathRole) {
      cachedClientRole = pathRole;
      cachedForUserId = user.id;
      cachedRoleFetched = true;
      return;
    }

    if (isAuthPage) {
      return;
    }

    if (cachedForUserId === user.id && cachedRoleFetched) {
      return;
    }

    let isMounted = true;

    const fetchRoleData = async () => {
      try {
        const res = await fetch('/api/user/role');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          return;
        }
        const data = await res.json();
        const resolvedRole = data.role ?? null;
        cachedClientRole = resolvedRole;
        cachedForUserId = user.id;
        cachedRoleFetched = true;

        if (isMounted) {
          setApiRole(resolvedRole);
        }
      } catch (err) {
        console.error('[useUserRole] Error:', err);
      }
    };

    void fetchRoleData();

    return () => {
      isMounted = false;
    };
  }, [isLoaded, isSignedIn, user, pathRole, isAuthPage]);

  const isLoadingRole =
    isLoaded &&
    isSignedIn &&
    !isAuthPage &&
    effectiveRole === null &&
    !(cachedForUserId === user?.id && cachedRoleFetched);

  return {
    role: effectiveRole,
    isSignedIn: !!isSignedIn,
    isLoaded,
    isLoadingRole,
  };
}
