import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Grid,
  Settings,
  CreditCard,
  MessageSquare,
  User,
  Compass,
  Inbox,
  Star,
  TrendingUp,
  Wrench,
  CalendarClock,
  FolderTree,
  type LucideIcon,
} from 'lucide-react';

export type PortalArea = 'student' | 'provider' | 'admin';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'warning' | 'success' | 'glow';
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const PORTAL_CONFIGS: Record<
  PortalArea,
  {
    name: string;
    roleLabel: string;
    description: string;
    colorVariant: 'blue' | 'indigo' | 'emerald';
    navGroups: NavGroup[];
  }
> = {
  student: {
    name: 'Student Services Portal',
    roleLabel: 'Student View',
    description: 'Book hostel laundry, mess meal passes, IT devices, and facility rooms.',
    colorVariant: 'blue',
    navGroups: [
      {
        label: 'Navigation',
        items: [
          {
            title: 'Dashboard',
            href: '/student/dashboard',
            icon: LayoutDashboard,
          },
          {
            title: 'Browse Services',
            href: '/student/services',
            icon: Compass,
          },
          {
            title: 'My Bookings',
            href: '/student/bookings',
            icon: CalendarDays,
          },
          {
            title: 'Payments',
            href: '/student/dashboard#payments',
            icon: CreditCard,
          },
          {
            title: 'Feedback',
            href: '/student/dashboard#feedback',
            icon: MessageSquare,
          },
          {
            title: 'Profile',
            href: '/student/profile',
            icon: User,
          },
        ],
      },
    ],
  },

  provider: {
    name: 'Service Provider Desk',
    roleLabel: 'Provider View',
    description: 'Fulfill work orders, manage facility queues, and confirm delivery tokens.',
    colorVariant: 'indigo',
    navGroups: [
      {
        label: 'Navigation',
        items: [
          {
            title: 'Dashboard',
            href: '/provider/dashboard',
            icon: LayoutDashboard,
          },
          {
            title: 'My Services',
            href: '/provider/services',
            icon: Wrench,
          },
          {
            title: 'Availability',
            href: '/provider/availability',
            icon: CalendarClock,
          },
          {
            title: 'Manage Bookings',
            href: '/provider/bookings',
            icon: Inbox,
          },
          {
            title: 'Earnings',
            href: '/provider/dashboard#earnings',
            icon: TrendingUp,
          },
          {
            title: 'Reviews',
            href: '/provider/dashboard#reviews',
            icon: Star,
          },
          {
            title: 'Profile',
            href: '/provider/profile',
            icon: User,
          },
        ],
      },
    ],
  },

  admin: {
    name: 'Campus Central Administration',
    roleLabel: 'Admin View',
    description: 'University-wide service analytics, user directory, audit trails, and reconciliation.',
    colorVariant: 'emerald',
    navGroups: [
      {
        label: 'Navigation',
        items: [
          {
            title: 'Dashboard',
            href: '/admin/dashboard',
            icon: LayoutDashboard,
          },
          {
            title: 'Users',
            href: '/admin/users',
            icon: Users,
          },
          {
            title: 'Services',
            href: '/admin/services',
            icon: Grid,
          },
          {
            title: 'Categories',
            href: '/admin/categories',
            icon: FolderTree,
          },
          {
            title: 'Bookings',
            href: '/admin/bookings',
            icon: CalendarDays,
          },
          {
            title: 'Payments',
            href: '/admin/dashboard#payments',
            icon: CreditCard,
          },
          {
            title: 'Analytics',
            href: '/admin/analytics',
            icon: TrendingUp,
          },
          {
            title: 'Reviews',
            href: '/admin/reviews',
            icon: Star,
          },
          {
            title: 'Settings',
            href: '/admin/dashboard#settings',
            icon: Settings,
          },
        ],
      },
    ],
  },
};

