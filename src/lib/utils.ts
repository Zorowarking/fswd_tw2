import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ServiceBookingStatus, ServicePaymentStatus, UserRole } from '@/types';

/**
 * Combines Tailwind and class names conditionally with conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as Indian Rupee (INR) currency string
 * @param amount Amount in Rupees
 * @param showFreeLabel If true, amounts <= 0 return "Free"
 */
export function formatCurrency(amount: number, showFreeLabel = true): string {
  if (showFreeLabel && amount <= 0) {
    return 'Free';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Converts a rupee amount to paise for Razorpay integration
 */
export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Converts paise to rupees
 */
export function toRupees(paise: number): number {
  return paise / 100;
}

/**
 * Formats date into readable string (e.g., "28 Oct 2026, 05:30 PM")
 */
export function formatDateTime(dateInput: Date | string | number): string {
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Formats date into simple calendar string (e.g., "Wednesday, 28 October 2026")
 */
export function formatSimpleDate(dateInput: Date | string | number): string {
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Generates human-friendly campus booking reference number (e.g., "CS-2026-X8B2")
 */
export function generateBookingReference(prefix = 'CS'): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${year}-${random}`;
}

/**
 * Helper to get styling attributes for booking status badges
 */
export function getBookingStatusConfig(status: ServiceBookingStatus): {
  label: string;
  badgeClass: string;
} {
  switch (status) {
    case 'CONFIRMED':
      return {
        label: 'Confirmed',
        badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      };
    case 'IN_PROGRESS':
      return {
        label: 'In Progress',
        badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
      };
    case 'COMPLETED':
      return {
        label: 'Completed',
        badgeClass: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30',
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
      };
    case 'PENDING':
    default:
      return {
        label: 'Pending',
        badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      };
  }
}

/**
 * Helper to get styling attributes for payment status badges
 */
export function getPaymentStatusConfig(status: ServicePaymentStatus): {
  label: string;
  badgeClass: string;
} {
  switch (status) {
    case 'SUCCESS':
      return {
        label: 'Paid',
        badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      };
    case 'REFUNDED':
      return {
        label: 'Refunded',
        badgeClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
      };
    case 'FAILED':
      return {
        label: 'Failed',
        badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
      };
    case 'PENDING':
    default:
      return {
        label: 'Unpaid / Pending',
        badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      };
  }
}

/**
 * Helper to format user roles
 */
export function getRoleBadgeConfig(role: UserRole): {
  label: string;
  badgeClass: string;
} {
  switch (role) {
    case 'ADMIN':
      return {
        label: 'Campus Admin',
        badgeClass: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
      };
    case 'SERVICE_PROVIDER':
      return {
        label: 'Service Provider',
        badgeClass: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
      };
    case 'STUDENT':
    default:
      return {
        label: 'Student',
        badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      };
  }
}

/**
 * Generates URL-friendly slugs
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
