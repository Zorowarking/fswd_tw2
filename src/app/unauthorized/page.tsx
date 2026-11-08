import * as React from 'react';
import Link from 'next/link';
import { ShieldAlert, LogIn, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full border-border/80 shadow-2xl bg-card/80 backdrop-blur-xl">
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-600 shadow-inner">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <Badge variant="warning" className="mx-auto text-[10px]">
            Authentication Required
          </Badge>
          <CardTitle className="text-2xl font-bold">
            Unauthorized Access
          </CardTitle>
          <CardDescription className="text-xs">
            You must be signed in with a verified campus account to view this portal area or access its services.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 pt-2 text-xs text-muted-foreground text-center">
          <p>
            Please sign in through Clerk Single Sign-On. Once verified, you will be redirected back to your requested service destination.
          </p>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <Link href="/sign-in" className="w-full">
            <Button variant="default" className="w-full gap-2 text-xs">
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In with Clerk</span>
            </Button>
          </Link>
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
