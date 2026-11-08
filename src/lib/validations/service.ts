import { z } from 'zod';

export const serviceSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'Service name must be at least 3 characters long' })
    .max(100, { message: 'Service name cannot exceed 100 characters' })
    .trim(),
  categoryId: z
    .string()
    .min(1, { message: 'Please select a valid service category' })
    .trim(),
  price: z.coerce
    .number()
    .min(0, { message: 'Price cannot be negative' })
    .max(500000, { message: 'Price cannot exceed ₹500,000' }),
  durationMinutes: z.coerce
    .number()
    .min(5, { message: 'Duration must be at least 5 minutes' })
    .max(1440, { message: 'Duration cannot exceed 24 hours (1440 minutes)' })
    .default(30),
  capacity: z.coerce
    .number()
    .min(1, { message: 'Capacity must be at least 1 person/slot' })
    .max(1000, { message: 'Capacity cannot exceed 1000' })
    .default(1),
  location: z
    .string()
    .min(2, { message: 'Location must be at least 2 characters long' })
    .max(200, { message: 'Location cannot exceed 200 characters' })
    .trim(),
  description: z
    .string()
    .max(2000, { message: 'Description cannot exceed 2000 characters' })
    .optional()
    .or(z.literal('')),
  imageUrl: z
    .string()
    .optional()
    .or(z.literal('')),
  isActive: z.boolean().default(true),
});

export type ServiceFormData = z.infer<typeof serviceSchema>;

export interface ServiceImagePreset {
  id: string;
  label: string;
  category: string;
  url: string;
}

export const SERVICE_IMAGE_PRESETS: ServiceImagePreset[] = [
  {
    id: 'preset-seminar',
    label: 'Seminar Hall & Auditorium',
    category: 'Seminar Halls',
    url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'preset-sports',
    label: 'Sports Court & Gym',
    category: 'Sports Facilities',
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'preset-lab',
    label: 'Lab & Computer Workstation',
    category: 'Laboratories',
    url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'preset-equipment',
    label: 'Equipment & Tool Rental',
    category: 'Equipment',
    url: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'preset-transport',
    label: 'Campus Buggy & Shuttle',
    category: 'Transportation',
    url: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'preset-print',
    label: 'Printing & Plotting Desk',
    category: 'Printing',
    url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'preset-event',
    label: 'Open-Air Amphitheatre & Stage',
    category: 'Event Spaces',
    url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'preset-maintenance',
    label: 'Campus Repairs & Maintenance',
    category: 'Maintenance',
    url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'preset-laundry',
    label: 'Hostel Commercial Laundry',
    category: 'Hostel Laundry Services',
    url: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'preset-dining',
    label: 'Campus Cafeteria & Meal Pass',
    category: 'Dining & Mess',
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
  },
];
