import * as React from 'react';
import Link from 'next/link';
import {
  Home,
  Layers,
  MapPinOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="relative min-h-[75vh] flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Visual 404 Badge & Icon */}
        <div className="space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-xl shadow-blue-500/10 ring-1 ring-primary/20">
            <MapPinOff className="h-10 w-10 text-blue-600" />
          </div>
          <Badge variant="glow" className="text-xs px-3 py-1 font-mono">
            HTTP 404 • ROUTE UNRESOLVED
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Campus Resource Not Located
          </h1>
          <p className="mx-auto max-w-lg text-sm sm:text-base text-muted-foreground leading-relaxed">
            The page, service ticket, or campus facility you are searching for does not exist or may have been relocated in the digital directory.
          </p>
        </div>

        {/* Quick Route Cards for Three Core Portals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <Link href="/student" className="group">
            <Card className="h-full border-border/80 bg-card/60 backdrop-blur-sm transition-all duration-200 group-hover:border-primary/50 group-hover:shadow-md">
              <CardHeader className="p-4 space-y-1">
                <Badge variant="default" className="w-fit text-[9px] px-1.5 py-0 mb-1">
                  Student Portal
                </Badge>
                <CardTitle className="text-sm font-bold group-hover:text-primary transition-colors">
                  Hostel & Dining
                </CardTitle>
                <CardDescription className="text-xs">
                  Laundry reservations and meal passes
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/provider" className="group">
            <Card className="h-full border-border/80 bg-card/60 backdrop-blur-sm transition-all duration-200 group-hover:border-primary/50 group-hover:shadow-md">
              <CardHeader className="p-4 space-y-1">
                <Badge variant="warning" className="w-fit text-[9px] px-1.5 py-0 mb-1">
                  Provider Desk
                </Badge>
                <CardTitle className="text-sm font-bold group-hover:text-primary transition-colors">
                  Service Partner
                </CardTitle>
                <CardDescription className="text-xs">
                  Assigned work order queues & verify tokens
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin" className="group">
            <Card className="h-full border-border/80 bg-card/60 backdrop-blur-sm transition-all duration-200 group-hover:border-primary/50 group-hover:shadow-md">
              <CardHeader className="p-4 space-y-1">
                <Badge variant="destructive" className="w-fit text-[9px] px-1.5 py-0 mb-1">
                  Admin Command
                </Badge>
                <CardTitle className="text-sm font-bold group-hover:text-primary transition-colors">
                  Central Campus
                </CardTitle>
                <CardDescription className="text-xs">
                  Role directories, analytics & audit logs
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Link href="/">
            <Button variant="default" className="gap-2">
              <Home className="h-4 w-4" />
              <span>Return to Public Landing</span>
            </Button>
          </Link>
          <Link href="/api/health">
            <Button variant="outline" className="gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span>Verify System Health</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
