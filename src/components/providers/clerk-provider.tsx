'use client';

import * as React from 'react';
import { ClerkProvider } from '@clerk/nextjs';

interface CampusClerkProviderProps {
  children: React.ReactNode;
}

/**
 * CampusClerkProvider wraps the application in Clerk authentication
 * with custom branding tailored for CampusServe SaaS.
 */
export function CampusClerkProvider({ children }: CampusClerkProviderProps) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#2563eb',
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
