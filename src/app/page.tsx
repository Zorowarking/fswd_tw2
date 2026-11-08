import * as React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser, getRoleDashboardUrl } from '@/lib/auth-role';
import {
  Shirt,
  UtensilsCrossed,
  Laptop,
  Building2,
  Wrench,
  Printer,
  ShieldCheck,
  ArrowRight,
  Clock,
  CreditCard,
  Database,
  Lock,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Activity,
  Server,
  Layers,
  LayoutDashboard,
  CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CAMPUS_SERVICE_CATEGORIES, USER_ROLES } from '@/lib/constants';
import { DesignSystemPreview } from '@/components/design-system/design-system-preview';

// Icon mapping helper for categories
const iconMap = {
  Shirt,
  UtensilsCrossed,
  Laptop,
  Building2,
  Wrench,
  Printer,
};

export default async function HomePage() {
  const user = await getCurrentUser();

  // Enforce absolute role-selection requirement:
  // If authenticated and role == NULL, must immediately redirect to /select-role
  // No intermediate homepage, dashboard, or other normal routes permitted.
  if (user && !user.role) {
    redirect('/select-role');
  }

  const role = user?.role ?? null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Decorative ambient gradient backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex justify-center">
        <div className="h-[520px] w-full max-w-7xl bg-gradient-to-b from-blue-500/10 via-indigo-500/5 to-transparent blur-3xl" />
        <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-blue-400/10 blur-[100px]" />
        <div className="absolute top-40 right-1/4 h-80 w-80 rounded-full bg-violet-400/10 blur-[120px]" />
      </div>

      {/* Hero Section */}
      <section className="relative px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          {/* Release Badge or Dynamic User Greeting */}
          {user && role ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 backdrop-blur-md shadow-sm mb-4">
              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              <span>Welcome back, {user.name}!</span>
              <span className="h-1 w-1 rounded-full bg-blue-500" />
              <Link
                href={getRoleDashboardUrl(role)}
                className="inline-flex items-center gap-1 font-bold underline hover:opacity-80 transition-opacity"
              >
                <span>Go to {role === 'STUDENT' ? 'Student Portal' : role === 'SERVICE_PROVIDER' ? 'Provider Desk' : 'Admin Console'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : user && !role ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 backdrop-blur-md shadow-sm mb-4">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Account Created! Choose your Campus Role:</span>
              <Link
                href="/select-role"
                className="inline-flex items-center gap-1 font-bold underline hover:opacity-80 transition-opacity"
              >
                <span>Select Role</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary backdrop-blur-md shadow-sm transition-all hover:bg-primary/10">
              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              <span>Campus Digital Infrastructure 2026</span>
              <span className="h-1 w-1 rounded-full bg-primary" />
              <span className="text-muted-foreground font-normal">Next-Gen Service Portal</span>
            </div>
          )}

          {/* Main Headline */}
          <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Smart Campus Service Booking &{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Operations Hub
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg lg:text-xl leading-relaxed">
            A unified full-stack ecosystem enabling students, faculty, staff, and vendors to schedule campus amenities, track maintenance orders, and complete instant test-mode payments seamlessly.
          </p>

          {/* Call-to-actions */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {role === 'SERVICE_PROVIDER' ? (
              <>
                <Link href="/provider/bookings">
                  <Button
                    size="lg"
                    variant="gradient"
                    className="gap-2 px-7 text-sm font-semibold shadow-xl shadow-blue-500/20"
                    id="hero-provider-bookings-button"
                  >
                    <span>Manage Bookings Queue</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/provider/services">
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 px-7 text-sm font-semibold bg-background/60 backdrop-blur-sm"
                    id="hero-provider-services-button"
                  >
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    <span>My Listed Services</span>
                  </Button>
                </Link>
              </>
            ) : role === 'ADMIN' ? (
              <>
                <Link href="/admin/dashboard">
                  <Button
                    size="lg"
                    variant="gradient"
                    className="gap-2 px-7 text-sm font-semibold shadow-xl shadow-blue-500/20"
                    id="hero-admin-dashboard-button"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Admin Dashboard</span>
                  </Button>
                </Link>
                <Link href="/admin/categories">
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 px-7 text-sm font-semibold bg-background/60 backdrop-blur-sm"
                    id="hero-admin-categories-button"
                  >
                    <span>Manage Categories</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </Link>
              </>
            ) : user && !role ? (
              <>
                <Link href="/select-role">
                  <Button
                    size="lg"
                    variant="gradient"
                    className="gap-2 px-7 text-sm font-semibold shadow-xl shadow-blue-500/20"
                    id="hero-select-role-button"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Select Campus Role</span>
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 px-7 text-sm font-semibold bg-background/60 backdrop-blur-sm"
                    id="hero-how-it-works-button"
                  >
                    <span>How CampusServe Works</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </a>
              </>
            ) : (
              <>
                <Link href="/student/services">
                  <Button
                    size="lg"
                    variant="gradient"
                    className="gap-2 px-7 text-sm font-semibold shadow-xl shadow-blue-500/20"
                    id="hero-explore-button"
                  >
                    <span>Explore Services</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                {role === 'STUDENT' ? (
                  <Link href="/student/bookings">
                    <Button
                      size="lg"
                      variant="outline"
                      className="gap-2 px-7 text-sm font-semibold bg-background/60 backdrop-blur-sm"
                      id="hero-student-bookings-button"
                    >
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <span>My Bookings</span>
                    </Button>
                  </Link>
                ) : (
                  <a href="#how-it-works">
                    <Button
                      size="lg"
                      variant="outline"
                      className="gap-2 px-7 text-sm font-semibold bg-background/60 backdrop-blur-sm"
                      id="hero-how-it-works-button"
                    >
                      <span>How It Works</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </a>
                )}
              </>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-16 grid grid-cols-2 gap-4 border-y border-border/60 py-6 sm:grid-cols-4 bg-muted/20 backdrop-blur-sm rounded-2xl px-6">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-foreground sm:text-3xl">6+</span>
              <span className="text-xs text-muted-foreground font-medium mt-1">Campus Sectors</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-blue-600 sm:text-3xl">5 Roles</span>
              <span className="text-xs text-muted-foreground font-medium mt-1">RBAC Controlled</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-foreground sm:text-3xl">100%</span>
              <span className="text-xs text-muted-foreground font-medium mt-1">Serverless Neon DB</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-emerald-600 sm:text-3xl">Instant</span>
              <span className="text-xs text-muted-foreground font-medium mt-1">Test Settlement</span>
            </div>
          </div>
        </div>
      </section>

      {/* Service Sectors Grid */}
      <section id="services" className="relative px-4 py-20 sm:px-6 lg:px-8 bg-muted/30">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center text-center mb-16">
            <Badge variant="glow" className="mb-3 px-3 py-1 text-xs">
              Campus Facilities
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Centralized University Service Portfolio
            </h2>
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-muted-foreground">
              Every campus need digitized in a single portal with transparent scheduling, automated queue management, and instant notifications.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CAMPUS_SERVICE_CATEGORIES.map((category) => {
              const IconComponent =
                iconMap[category.icon as keyof typeof iconMap] || Activity;

              return (
                <Link
                  key={category.id}
                  href={`/student/services?category=${category.slug}`}
                  className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
                  id={`service-card-${category.slug}`}
                >
                  <Card className="h-full relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 hover:border-primary/50 bg-card/80 backdrop-blur-sm cursor-pointer">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <CardHeader className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground shadow-sm">
                          <IconComponent className="h-6 w-6" />
                        </div>
                        {category.badge && (
                          <Badge
                            variant={category.popular ? 'default' : 'secondary'}
                            className="text-[11px]"
                          >
                            {category.badge}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {category.name}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {category.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Clock className="h-3.5 w-3.5 text-blue-500" /> Real-time Slot Sync
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
                          Browse Category <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Full services directory CTA button */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/student/services">
              <Button
                size="lg"
                variant="gradient"
                className="gap-2 px-8 text-sm font-semibold shadow-xl shadow-blue-500/20"
                id="services-browse-catalog-button"
              >
                <span>Browse Full Services Catalog</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Multi-Role Persona Architecture / About */}
      <section id="about" className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center text-center mb-16">
            <Badge variant="glow" className="mb-3 px-3 py-1 text-xs">
              Role-Based Access Control
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Architected for the Entire Campus Community
            </h2>
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-muted-foreground">
              CampusServe enforces secure role separation with Clerk authentication and Prisma ORM to serve every stakeholder group.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {USER_ROLES.map((item) => (
              <div
                key={item.role}
                className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card/60 p-6 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
              >
                <div className="space-y-3">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {item.role}
                  </Badge>
                  <h3 className="text-base font-bold text-foreground">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border/50 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Enforced via Clerk</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Guarantee Section */}
      <section id="architecture" className="relative px-4 py-20 sm:px-6 lg:px-8 bg-slate-900 text-slate-100 rounded-3xl mx-4 sm:mx-8 mb-20 shadow-2xl overflow-hidden">
        <div className="pointer-events-none absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-blue-600/20 blur-[100px]" />
        <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-indigo-600/20 blur-[100px]" />

        <div className="relative mx-auto max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
              <Server className="h-3.5 w-3.5" /> Strictly Limited Production Stack
            </span>
            <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl tracking-tight text-white">
              Built on Modern Serverless Standards
            </h2>
            <p className="mt-3 text-slate-300 text-sm sm:text-base">
              No extraneous third-party services. Designed with pure Next.js App Router, Clerk, Prisma, Neon PostgreSQL, and Razorpay Test Mode.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Next.js & App Router */}
            <div className="rounded-2xl border border-slate-800 bg-slate-800/60 p-6 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Next.js App Router</h3>
                  <p className="text-xs text-slate-400">React 19 Server Components</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Modern streaming architecture, React Server Components (RSC), type-safe route handlers, and zero layout shift.
              </p>
            </div>

            {/* Clerk Authentication */}
            <div className="rounded-2xl border border-slate-800 bg-slate-800/60 p-6 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Clerk Authentication</h3>
                  <p className="text-xs text-slate-400">Identity & RBAC Middleware</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Enterprise session management, multi-factor security, campus email validation, and middleware route protection.
              </p>
            </div>

            {/* Neon PostgreSQL */}
            <div className="rounded-2xl border border-slate-800 bg-slate-800/60 p-6 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Neon PostgreSQL</h3>
                  <p className="text-xs text-slate-400">Prisma ORM Managed</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                High-concurrency serverless Postgres with connection pooling, declarative migrations, and relational integrity.
              </p>
            </div>

            {/* Razorpay Test Mode */}
            <div className="rounded-2xl border border-slate-800 bg-slate-800/60 p-6 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Razorpay Test Mode</h3>
                  <p className="text-xs text-slate-400">Simulated INR Transactions</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Test checkout modal, order token creation, HMAC SHA256 payment signature verification, and automated receipts.
              </p>
            </div>

            {/* Tailwind CSS & shadcn/ui */}
            <div className="rounded-2xl border border-slate-800 bg-slate-800/60 p-6 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Tailwind CSS & shadcn</h3>
                  <p className="text-xs text-slate-400">Design Token System</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Accessible, composable primitives with CVA variants, fluid micro-interactions, and strict typography rules.
              </p>
            </div>

            {/* Strict TypeScript */}
            <div className="rounded-2xl border border-slate-800 bg-slate-800/60 p-6 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">TypeScript Strict</h3>
                  <p className="text-xs text-slate-400">End-to-End Type Safety</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Strict compilation, strongly typed API contracts, and unified Prisma models across frontend and backend.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Workflow */}
      <section id="how-it-works" className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <Badge variant="glow" className="mb-3 px-3 py-1 text-xs">
              Campus Workflow
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Frictionless 4-Step Service Journey
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              From slot discovery to verified delivery and payment receipt.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold text-lg shadow-md shadow-blue-500/25">
                1
              </div>
              <h3 className="font-bold text-foreground text-sm sm:text-base">Browse & Select</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Find your service: laundry machines, canteen meal pre-orders, or repair tickets.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white font-bold text-lg shadow-md shadow-indigo-500/25">
                2
              </div>
              <h3 className="font-bold text-foreground text-sm sm:text-base">Schedule Slot</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pick your preferred time slot and specify your hostel room or campus lab location.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white font-bold text-lg shadow-md shadow-violet-500/25">
                3
              </div>
              <h3 className="font-bold text-foreground text-sm sm:text-base">Razorpay Test Pay</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Instant test checkout simulation in INR with automatic digital receipt generation.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white font-bold text-lg shadow-md shadow-emerald-500/25">
                4
              </div>
              <h3 className="font-bold text-foreground text-sm sm:text-base">Track Fulfillment</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Receive live updates as campus staff or vendors confirm and complete your request.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Design System Showcase Section */}
      <section id="design-system" className="relative px-4 py-20 sm:px-6 lg:px-8 bg-muted/40 border-y border-border/60">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center text-center mb-12">
            <Badge variant="glow" className="mb-3 px-3 py-1 text-xs">
              Complete Visual Design System
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Engineered for Modern University SaaS
            </h2>
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-muted-foreground">
              A comprehensive library of accessible shadcn/ui components, subtle animations, refined border radii, and consistent design tokens throughout CampusServe.
            </p>
          </div>

          <DesignSystemPreview />
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-4 py-16 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-blue-50/50 to-blue-100/30 dark:from-transparent dark:via-blue-950/20 dark:to-blue-900/10">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Experience Campus Digital Infrastructure
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base text-muted-foreground">
            Explore live university amenities, reserve real-time slots, simulate INR test transactions, and manage campus operations.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/student/services">
              <Button variant="gradient" size="lg" className="gap-2 shadow-lg shadow-blue-500/20">
                <span>Browse All Services</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/provider/bookings">
              <Button variant="outline" size="lg" className="gap-2 bg-background/60 backdrop-blur-sm">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <span>Provider Desk</span>
              </Button>
            </Link>
            <Link href="/api/health">
              <Button variant="ghost" size="lg" className="gap-2">
                <Activity className="h-4 w-4" />
                <span>Health API</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
