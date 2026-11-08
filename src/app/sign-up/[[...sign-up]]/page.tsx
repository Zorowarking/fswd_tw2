import * as React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { resolveAuthenticatedUserId } from '@/lib/auth-role';
import { SignUp } from '@clerk/nextjs';
import { GraduationCap, ShieldCheck, ArrowLeft } from 'lucide-react';
import { AuthPageGuard } from '@/components/auth/auth-page-guard';

export default async function SignUpPage() {
  const userId = await resolveAuthenticatedUserId();

  // If already authenticated on server, redirect straight to post-auth dispatcher
  if (userId) {
    redirect('/auth-redirect');
  }

  return (
    <AuthPageGuard>
      <div className="relative min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        {/* Ambient background glows */}
        <div className="pointer-events-none absolute inset-0 -z-10 flex justify-center overflow-hidden">
          <div className="h-[400px] w-full max-w-4xl bg-gradient-to-b from-blue-500/10 via-indigo-500/5 to-transparent blur-3xl" />
          <div className="absolute top-1/4 -left-20 h-64 w-64 rounded-full bg-blue-500/10 blur-[80px]" />
          <div className="absolute top-1/4 -right-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-[80px]" />
        </div>

        <div className="w-full max-w-md space-y-6">
          {/* Top return link & Branding Header */}
          <div className="text-center space-y-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Campus Portal</span>
            </Link>

            <div className="flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white shadow-lg shadow-blue-500/25">
                <GraduationCap className="h-6 w-6" />
              </div>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Create Campus Account
            </h1>

            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Register with any email address to get started with CampusServe.
            </p>
          </div>

          {/* Clerk Official SignUp Component */}
          <div className="flex justify-center">
            <SignUp
              routing="path"
              path="/sign-up"
              signInUrl="/sign-in"
              forceRedirectUrl="/auth-redirect"
            />
          </div>

          {/* Security badge */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Official University Authentication Service.</span>
            </div>
          </div>
        </div>
      </div>
    </AuthPageGuard>
  );
}
