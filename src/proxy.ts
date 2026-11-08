import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher, verifyToken } from '@clerk/nextjs/server';

/**
 * Route protection matcher for CampusServe
 * Public routes remain accessible without authentication.
 * All application portals (/student, /provider, /admin, /profile) require active Clerk sessions.
 */
const isPublicRoute = createRouteMatcher([
  '/',
  '/services',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/select-role',
  '/auth-redirect',
  '/unauthorized(.*)',
  '/api/(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  // Never redirect API routes to HTML login pages; API routes manage their own auth
  if (request.nextUrl.pathname.startsWith('/api')) {
    return;
  }

  if (!isPublicRoute(request)) {
    let { userId } = await auth();

    // Cryptographic fallback: verify __session cookie token signature with Clerk secret/jwt keys
    if (!userId) {
      const sessionCookie = request.cookies.get('__session')?.value;
      if (sessionCookie && process.env.CLERK_SECRET_KEY) {
        try {
          const verified = await verifyToken(sessionCookie, {
            secretKey: process.env.CLERK_SECRET_KEY,
            jwtKey: process.env.CLERK_JWT_KEY,
          });
          if (verified?.sub && typeof verified.sub === 'string' && verified.sub.startsWith('user_')) {
            userId = verified.sub;
          }
        } catch {
          // Token signature is invalid or forged — reject
        }
      }
    }

    if (!userId) {
      const signInUrl = new URL('/sign-in', request.url);
      const redirectPath = request.nextUrl.pathname + request.nextUrl.search;
      signInUrl.searchParams.set('redirect_url', redirectPath);
      return NextResponse.redirect(signInUrl);
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static assets unless query parameters are passed
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always enforce for API routes
    '/(api|trpc)(.*)',
  ],
};

