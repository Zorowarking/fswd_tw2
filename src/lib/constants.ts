import type { CampusServiceCategory, UserRole } from '@/types';

export const APP_CONFIG = {
  name: 'CampusServe',
  tagline: 'Smart Campus Service Booking & Management System',
  description:
    'A unified digital hub for university students, faculty, and administration to discover, schedule, and manage campus services with instant payments.',
  version: '1.0.0-foundation',
  supportEmail: 'support@campusserve.edu',
  emergencyDesk: '+91 (0) 11 2659-1000',
  campusLocation: 'Central University Campus, Tech Park Complex',
};

export const CAMPUS_SERVICE_CATEGORIES: CampusServiceCategory[] = [
  {
    id: 'laundry-hub',
    name: 'Hostel Laundry Services',
    slug: 'hostel-laundry',
    description: 'Automated machine slot booking, wash-and-fold pickup, and dry cleaning.',
    icon: 'Shirt',
    badge: 'Popular',
    popular: true,
  },
  {
    id: 'mess-canteen',
    name: 'Mess & Food Court Pre-order',
    slug: 'mess-food-court',
    description: 'Pre-order meal tokens, special diet requests, and night canteen slots.',
    icon: 'UtensilsCrossed',
    badge: 'Fast-Track',
    popular: true,
  },
  {
    id: 'lab-it-support',
    name: 'Lab & IT Device Support',
    slug: 'lab-it-support',
    description: 'Wi-Fi clearance, high-performance workstation passes, and hardware repairs.',
    icon: 'Laptop',
    badge: 'Essential',
  },
  {
    id: 'facility-booking',
    name: 'Facility & Seminar Hall',
    slug: 'facility-hall-booking',
    description: 'Reserve auditorium seats, discussion rooms, amphitheater, and sports courts.',
    icon: 'Building2',
  },
  {
    id: 'hostel-maintenance',
    name: 'Hostel Maintenance & Electrician',
    slug: 'hostel-maintenance',
    description: 'Log verified repair tickets for plumbing, electricals, and carpentry.',
    icon: 'Wrench',
  },
  {
    id: 'stationery-print',
    name: 'Reprographics & Print Hub',
    slug: 'reprographics-print-hub',
    description: 'High-speed thesis binding, poster printing, and course pack dispatch.',
    icon: 'Printer',
  },
];

export const USER_ROLES: { role: UserRole; title: string; description: string }[] = [
  {
    role: 'STUDENT',
    title: 'Student Portal',
    description: 'Browse campus services, make instant bookings, track status, and manage payments.',
  },
  {
    role: 'SERVICE_PROVIDER',
    title: 'Service Provider Desk',
    description: 'Manage services catalog, set availability, fulfill booking requests, and track earnings.',
  },
  {
    role: 'ADMIN',
    title: 'Campus Administration',
    description: 'Campus-wide analytics, audit logs, service metrics, and system monitoring.',
  },
];

export const NAV_LINKS = [
  { label: 'Services', href: '/#services' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'About', href: '/#about' },
];

