import * as React from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Database,
  Lock,
  CreditCard,
  Layers,
  PhoneCall,
  Mail,
  MapPin,
} from 'lucide-react';
import { APP_CONFIG } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="border-t border-border/80 bg-background/50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm">
                <GraduationCap className="h-4 w-4" />
              </div>
              <span className="font-bold text-lg text-foreground tracking-tight">
                {APP_CONFIG.name}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              {APP_CONFIG.description}
            </p>

            {/* Architecture Stack Badge */}
            <div className="pt-2">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Verified Production Stack
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] text-foreground font-mono">
                  <Layers className="h-3 w-3 text-blue-500" /> Next.js App Router
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] text-foreground font-mono">
                  <Lock className="h-3 w-3 text-purple-500" /> Clerk Auth
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] text-foreground font-mono">
                  <Database className="h-3 w-3 text-emerald-500" /> Neon PostgreSQL
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] text-foreground font-mono">
                  <CreditCard className="h-3 w-3 text-sky-500" /> Razorpay Test Mode
                </span>
              </div>
            </div>
          </div>

          {/* Campus Services Quicklinks */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Core Services
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <a href="#services" className="transition-colors hover:text-foreground">
                  Hostel Laundry Automation
                </a>
              </li>
              <li>
                <a href="#services" className="transition-colors hover:text-foreground">
                  Mess & Canteen Tokens
                </a>
              </li>
              <li>
                <a href="#services" className="transition-colors hover:text-foreground">
                  Lab & Hardware Desk
                </a>
              </li>
              <li>
                <a href="#services" className="transition-colors hover:text-foreground">
                  Seminar Hall Booking
                </a>
              </li>
              <li>
                <a href="#services" className="transition-colors hover:text-foreground">
                  Hostel Maintenance Tickets
                </a>
              </li>
            </ul>
          </div>

          {/* User Portals */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Role Access
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <span className="cursor-default hover:text-foreground transition-colors">
                  Student Dashboard
                </span>
              </li>
              <li>
                <span className="cursor-default hover:text-foreground transition-colors">
                  Faculty Priority Portal
                </span>
              </li>
              <li>
                <span className="cursor-default hover:text-foreground transition-colors">
                  Campus Staff Terminal
                </span>
              </li>
              <li>
                <span className="cursor-default hover:text-foreground transition-colors">
                  Service Vendor Desk
                </span>
              </li>
              <li>
                <span className="cursor-default hover:text-foreground transition-colors">
                  Central Administration
                </span>
              </li>
            </ul>
          </div>

          {/* Campus Emergency & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Campus Helpdesk
            </h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <PhoneCall className="h-3.5 w-3.5 text-primary" />
                <span>{APP_CONFIG.emergencyDesk}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-primary" />
                <span>{APP_CONFIG.supportEmail}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <span>{APP_CONFIG.campusLocation}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-border/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div>
            &copy; 2026 {APP_CONFIG.name}. Built for Smart Higher Education Infrastructure.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/api/health" className="hover:text-foreground transition-colors underline-offset-4 hover:underline">
              System Health API
            </Link>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              Stage 1: Production Foundation Ready
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
