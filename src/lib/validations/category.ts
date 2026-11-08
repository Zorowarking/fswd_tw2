import { z } from 'zod';

export const categorySchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Category name must be at least 2 characters long' })
    .max(60, { message: 'Category name cannot exceed 60 characters' })
    .trim(),
  slug: z
    .string()
    .min(2, { message: 'Slug must be at least 2 characters long' })
    .max(60, { message: 'Slug cannot exceed 60 characters' })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: 'Slug must contain only lowercase alphanumeric characters and hyphens',
    })
    .trim(),
  description: z
    .string()
    .max(500, { message: 'Description cannot exceed 500 characters' })
    .optional()
    .or(z.literal('')),
  icon: z
    .string()
    .max(50, { message: 'Icon identifier cannot exceed 50 characters' })
    .optional()
    .or(z.literal('')),
  isActive: z.boolean().default(true),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

/**
 * Utility to generate an URL-friendly slug from a category title
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Available default icons for service categories
 */
export const CATEGORY_ICON_OPTIONS = [
  { value: 'Building2', label: 'Building / Hall' },
  { value: 'Trophy', label: 'Sports / Recreation' },
  { value: 'FlaskConical', label: 'Laboratory' },
  { value: 'Wrench', label: 'Equipment / Tools' },
  { value: 'Bus', label: 'Transportation' },
  { value: 'Printer', label: 'Printing / Reprographics' },
  { value: 'Calendar', label: 'Event Spaces' },
  { value: 'Hammer', label: 'Maintenance / Repairs' },
  { value: 'HelpCircle', label: 'Other / General' },
  { value: 'Cpu', label: 'Computing / IT' },
  { value: 'Shirt', label: 'Laundry & Hygiene' },
  { value: 'UtensilsCrossed', label: 'Dining & Mess' },
] as const;

/**
 * Standard example categories for CampusServe
 */
export const EXAMPLE_CATEGORIES: Array<{
  name: string;
  slug: string;
  description: string;
  icon: string;
}> = [
  {
    name: 'Seminar Halls',
    slug: 'seminar-halls',
    description: 'Auditoriums, smart conference rooms, and lecture theatres with AV projection.',
    icon: 'Building2',
  },
  {
    name: 'Sports Facilities',
    slug: 'sports-facilities',
    description: 'Badminton courts, football turf, tennis court reservations, and indoor stadium.',
    icon: 'Trophy',
  },
  {
    name: 'Laboratories',
    slug: 'laboratories',
    description: 'Chemistry, advanced computing clusters, electronics workstations, and bio-tech bays.',
    icon: 'FlaskConical',
  },
  {
    name: 'Equipment',
    slug: 'equipment',
    description: 'Specialized lab instruments, cameras, projectors, measuring meters, and power tools.',
    icon: 'Wrench',
  },
  {
    name: 'Transportation',
    slug: 'transportation',
    description: 'Campus shuttle pass, electric buggy hire, interstate study tour bus bookings.',
    icon: 'Bus',
  },
  {
    name: 'Printing',
    slug: 'printing',
    description: 'High-speed dissertation plotting, 3D printing, color reprographics, and spiral binding.',
    icon: 'Printer',
  },
  {
    name: 'Event Spaces',
    slug: 'event-spaces',
    description: 'Open-air amphitheatres, cultural stage, exhibition courtyards, and fest booths.',
    icon: 'Calendar',
  },
  {
    name: 'Maintenance',
    slug: 'maintenance',
    description: 'Hostel plumbing, electrical repairs, HVAC servicing, and carpentry work orders.',
    icon: 'Hammer',
  },
  {
    name: 'Other',
    slug: 'other',
    description: 'General campus utilities, lost & found assistance, and ad-hoc department support.',
    icon: 'HelpCircle',
  },
];
