'use client';

import * as React from 'react';
import {
  Sparkles,
  Layers,
  Calendar,
  MoreVertical,
  ExternalLink,
  SlidersHorizontal,
  Bell,
  Shield,
  CreditCard,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectGroup,
} from '@/components/ui/select';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/sonner';
import { StatusIndicator } from '@/components/ui/status-indicator';

export function DesignSystemPreview() {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState('laundry');

  return (
    <div className="w-full space-y-8">
      <Tabs defaultValue="components" className="w-full">
        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="components">Interactive UI Kit</TabsTrigger>
            <TabsTrigger value="data-table">Data & Tables</TabsTrigger>
            <TabsTrigger value="overlays">Dialogs & Overlays</TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Interactive Core Components */}
        <TabsContent value="components" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Button Kit */}
            <Card className="bg-card/70 backdrop-blur-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-500" /> Buttons & Action Triggers
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px]">CVA Powered</Badge>
                </div>
                <CardDescription>
                  SaaS button variants supporting subtle active scales, loading animations, and gradients.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2.5 items-center">
                  <Button variant="default" size="sm">Primary</Button>
                  <Button variant="gradient" size="sm">Gradient</Button>
                  <Button variant="secondary" size="sm">Secondary</Button>
                  <Button variant="outline" size="sm">Outline</Button>
                  <Button variant="subtle" size="sm">Subtle</Button>
                  <Button variant="ghost" size="sm">Ghost</Button>
                  <Button variant="destructive" size="sm">Destructive</Button>
                </div>
                <div className="flex flex-wrap gap-2.5 items-center pt-2 border-t border-border/50">
                  <Button size="sm" isLoading>Processing</Button>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toast.success('Payment token authorized in Razorpay test mode')}
                      >
                        <Bell className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                        Trigger Success Toast
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Emits a stylized Sonner toast alert</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => toast.error('Booking slot already reserved by another user')}
                      >
                        Trigger Error Toast
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Displays a critical toast notification</TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>

            {/* Badges & Status Indicators */}
            <Card className="bg-card/70 backdrop-blur-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-500" /> Status & Semantic Badges
                  </CardTitle>
                  <Badge variant="glow" className="text-[10px]">Tokens</Badge>
                </div>
                <CardDescription>
                  Real-time operational indicators and role tags designed for university services.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 items-center">
                  <StatusIndicator status="online" label="System Operational" />
                  <StatusIndicator status="busy" label="Peak Hours Queue" />
                  <StatusIndicator status="in_progress" label="Syncing Slots" />
                  <StatusIndicator status="maintenance" label="Lab Maintenance" />
                </div>
                <div className="flex flex-wrap gap-2 items-center pt-3 border-t border-border/50">
                  <Badge variant="default">Campus Wide</Badge>
                  <Badge variant="success">Confirmed (₹120)</Badge>
                  <Badge variant="warning">Awaiting Approval</Badge>
                  <Badge variant="info">Priority Faculty</Badge>
                  <Badge variant="destructive">Slot Expired</Badge>
                  <Badge variant="glow">Fast-Track</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Form Inputs & Selects */}
            <Card className="bg-card/70 backdrop-blur-md md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-primary" /> Accessible Form Elements
                </CardTitle>
                <CardDescription>
                  Focus rings, accessible labels, placeholder styling, and Radix UI dropdown selects.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="room-input">Campus Location / Room</Label>
                    <div className="relative">
                      <Input
                        id="room-input"
                        placeholder="e.g. Block C, Room 402"
                        defaultValue="Hostel Ganga, Wing B"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="category-select">Service Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger id="category-select">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>University Services</SelectLabel>
                          <SelectItem value="laundry">Hostel Laundry Automation</SelectItem>
                          <SelectItem value="mess">Mess & Canteen Meal Tokens</SelectItem>
                          <SelectItem value="lab">Lab & IT Hardware Passes</SelectItem>
                          <SelectItem value="hall">Seminar & Discussion Chambers</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="search-service">Search Catalog</Label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search-service"
                        placeholder="Filter services or equipment..."
                        className="pl-8"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Data & Tables */}
        <TabsContent value="data-table">
          <Card className="bg-card/70 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base font-bold">Campus Service Bookings Registry</CardTitle>
                <CardDescription>
                  Responsive tabular layout with status badges, timestamps, and contextual actions.
                </CardDescription>
              </div>
              <Badge variant="outline" className="hidden sm:inline-flex text-[10px]">
                Showing 4 Active Records
              </Badge>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference ID</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      CS-2026-L92A
                    </TableCell>
                    <TableCell className="font-medium">
                      Hostel Washing Machine (Slot 3)
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      Laundry Block A
                    </TableCell>
                    <TableCell className="text-xs">Today, 18:00</TableCell>
                    <TableCell>
                      <Badge variant="success">Confirmed</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Booking Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => toast.info('Booking details opened')}>
                            View Slip
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.success('Ticket copied to clipboard')}>
                            Share Token
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            Cancel Slot
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      CS-2026-M48K
                    </TableCell>
                    <TableCell className="font-medium">
                      Special Dinner Mess Pass
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      Central Dining Hall
                    </TableCell>
                    <TableCell className="text-xs">Tomorrow, 20:30</TableCell>
                    <TableCell>
                      <Badge variant="warning">In Queue</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Slip</DropdownMenuItem>
                          <DropdownMenuItem>Reschedule</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      CS-2026-H11X
                    </TableCell>
                    <TableCell className="font-medium">
                      Seminar Room 104 Booking
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      Faculty Annex 2F
                    </TableCell>
                    <TableCell className="text-xs">29 Oct, 14:00</TableCell>
                    <TableCell>
                      <Badge variant="info">Faculty Priority</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      CS-2026-W09B
                    </TableCell>
                    <TableCell className="font-medium">
                      AC Repair & Filter Clean
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      Lab 4, Tech Wing
                    </TableCell>
                    <TableCell className="text-xs">30 Oct, 10:00</TableCell>
                    <TableCell>
                      <Badge variant="default">Scheduled</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Overlays & Drawers */}
        <TabsContent value="overlays">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Modal Dialog Card */}
            <Card className="bg-card/70 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-500" /> Modal Dialog Primitive
                </CardTitle>
                <CardDescription>
                  Centered modal overlay with backdrop blur, focus trap, and keyboard Escape listener.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Used for verified student service confirmations, checkout payment prompts, and cancellation verifications.
                </p>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default" className="gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Open Service Booking Dialog</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[440px]">
                    <DialogHeader>
                      <DialogTitle>Confirm Service Slot</DialogTitle>
                      <DialogDescription>
                        Review your campus booking reservation before proceeding to Razorpay test simulation.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                      <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Service Name:</span>
                          <span className="font-semibold text-foreground">Heavy Wash & Fold Batch</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Scheduled Slot:</span>
                          <span className="font-semibold text-foreground">Today @ 18:30 IST</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Estimated Fee:</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">₹80 (Test Mode)</span>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="gradient"
                        onClick={() => {
                          setIsDialogOpen(false);
                          toast.success('Service slot CS-2026-X7 confirmed successfully!');
                        }}
                      >
                        Confirm Slot
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Slide-out Sheet Card */}
            <Card className="bg-card/70 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-sky-500" /> Slide-Out Sheet Primitive
                </CardTitle>
                <CardDescription>
                  Side drawer with smooth entrance transitions for navigation, filters, or inspection sidebars.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ideal for mobile drawer menus, service detail panels, or transaction ledgers without leaving the page.
                </p>
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <ExternalLink className="h-4 w-4 text-primary" />
                      <span>Open Side Sheet Drawer</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right">
                    <SheetHeader>
                      <SheetTitle>Campus Service Inspection</SheetTitle>
                      <SheetDescription>
                        Detailed telemetry and operational parameters for this campus facility.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-4 py-6 text-xs">
                      <div className="space-y-1.5">
                        <span className="text-muted-foreground">Operating Schedule:</span>
                        <p className="font-semibold text-foreground">Monday – Saturday: 07:00 – 22:00</p>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-muted-foreground">Supervising Officer:</span>
                        <p className="font-semibold text-foreground">Dr. Rajiv Sharma (Estate Office)</p>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-muted-foreground">Billing Gateway:</span>
                        <p className="font-semibold text-foreground">Razorpay Test Mode / Campus Wallet</p>
                      </div>
                      <div className="pt-4 border-t border-border">
                        <StatusIndicator status="online" label="Real-time telemetry active" />
                      </div>
                    </div>
                    <SheetFooter>
                      <Button
                        className="w-full"
                        onClick={() => {
                          setIsSheetOpen(false);
                          toast.info('Telemetry report exported');
                        }}
                      >
                        Export Log
                      </Button>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
