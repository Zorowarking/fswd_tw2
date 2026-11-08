'use server';

import { db } from '@/lib/db';
import { requireStudent } from '@/lib/auth-role';
import { BookingStatus, Prisma } from '@prisma/client';

export interface StudentServiceFilterParams {
  q?: string;
  category?: string;
  price?: string; // 'all' | 'free' | 'under-100' | '100-500' | 'above-500'
  minPrice?: number;
  maxPrice?: number;
  sort?: string; // 'featured' | 'rating' | 'price-asc' | 'price-desc' | 'popular' | 'newest'
  page?: number;
  pageSize?: number;
}

export interface StudentServiceItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number;
  capacity: number;
  location: string | null;
  imageUrl: string | null;
  categoryId: string | null;
  categoryName: string;
  categorySlug: string;
  categoryIcon: string | null;
  providerName: string;
  providerAvatarUrl: string | null;
  rating: number;
  reviewCount: number;
  totalBookings: number;
  availabilityLabel: string;
  createdAt: string;
}

export interface StudentServicesCategoryOption {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  count: number;
}

export interface StudentServicesResult {
  services: StudentServiceItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  categories: StudentServicesCategoryOption[];
  priceCounts: {
    all: number;
    free: number;
    under100: number;
    between100And500: number;
    above500: number;
  };
}

export interface ServiceTimeSlot {
  id: string;
  timeWindow: string;
  period: 'Morning' | 'Afternoon' | 'Evening';
  isAvailable: boolean;
}

export interface ServiceAvailableDate {
  dateString: string;
  displayDate: string;
  relativeLabel: string;
  dayOfWeek: string;
  isAvailable: boolean;
  slots: ServiceTimeSlot[];
}

export interface ServiceReviewItem {
  id: string;
  studentName: string;
  studentAvatar: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface StudentServiceDetail extends StudentServiceItem {
  categoryDescription: string | null;
  providerEmail: string | null;
  providerPhone: string | null;
  ratingBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  reviews: ServiceReviewItem[];
  availableDates: ServiceAvailableDate[];
}

/**
 * Default sample campus services for seed initialization
 */
const SAMPLE_CAMPUS_SERVICES = [
  {
    name: 'Central Auditorium & Main Seminar Hall',
    categorySlug: 'seminar-halls',
    price: 0,
    durationMinutes: 120,
    capacity: 150,
    location: 'Main Academic Block, 2nd Floor, Room 201',
    description:
      'Equipped with Dolby surround sound, 4K digital laser projection, dual wireless podium mics, and high-speed campus Wi-Fi for academic symposiums.',
    imageUrl:
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
    providerName: 'Campus Facility Operations',
  },
  {
    name: 'Indoor Badminton & Squash Arena',
    categorySlug: 'sports-facilities',
    price: 60,
    durationMinutes: 60,
    capacity: 4,
    location: 'Campus Sports Complex, Court 2',
    description:
      'Synthetic shock-absorbent wooden flooring, LED floodlights, and Yonex tournament racquets available on advance reservation.',
    imageUrl:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    providerName: 'Department of Physical Education',
  },
  {
    name: 'Advanced Spectroscopy & Chemistry Lab Slot',
    categorySlug: 'laboratories',
    price: 150,
    durationMinutes: 90,
    capacity: 6,
    location: 'Science & Innovation Tower, Lab B-04',
    description:
      'Access to FT-IR spectrometer, UV-Vis spectrophotometer, and certified laboratory technician assistance for undergraduate and thesis research.',
    imageUrl:
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
    providerName: 'School of Chemical Sciences',
  },
  {
    name: 'DSLR Camera & 4K Cinema Production Kit',
    categorySlug: 'equipment',
    price: 250,
    durationMinutes: 240,
    capacity: 2,
    location: 'Media Center & Journalism Wing, Desk 3',
    description:
      'Sony Alpha mirrorless kit with 24-70mm f/2.8 lens, directional shotgun mic, fluid head tripod, and 128GB high-speed SD card.',
    imageUrl:
      'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80',
    providerName: 'University Media & Arts Guild',
  },
  {
    name: 'Campus Electric Buggy & Shuttle Pass',
    categorySlug: 'transportation',
    price: 20,
    durationMinutes: 30,
    capacity: 8,
    location: 'North Gate Transit Hub to Hostel Complex',
    description:
      'Eco-friendly express campus shuttle connecting outer parking lots, residential hostels, library, and central lecture halls.',
    imageUrl:
      'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80',
    providerName: 'Campus Transit Services',
  },
  {
    name: 'High-Speed Thesis Printing & Hardcover Binding',
    categorySlug: 'printing',
    price: 85,
    durationMinutes: 30,
    capacity: 5,
    location: 'Central Library Ground Floor, Reprographics Bay',
    description:
      'High-resolution 1200 DPI double-sided plot printing, golden foil embossed thesis hardcover binding, and spiral binding.',
    imageUrl:
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
    providerName: 'Central Reprographics Unit',
  },
  {
    name: 'Open-Air Amphitheatre & Cultural Stage',
    categorySlug: 'event-spaces',
    price: 0,
    durationMinutes: 180,
    capacity: 300,
    location: 'Central Lawn Promenade, South Campus',
    description:
      'Acoustic open-air amphitheatre with multi-tier seating, spotlight rigging, and dedicated power generator backup for campus club events.',
    imageUrl:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    providerName: 'Student Affairs Council',
  },
  {
    name: 'Hostel Electrical & Appliance Maintenance Work Order',
    categorySlug: 'maintenance',
    price: 0,
    durationMinutes: 45,
    capacity: 3,
    location: 'Hostel Facilities Maintenance Office, Room 12',
    description:
      'Certified campus electrician checkup for room sockets, study lamps, ceiling fans, and network LAN ports with fast turnaround.',
    imageUrl:
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
    providerName: 'Estate & Hostel Works Dept',
  },
  {
    name: 'Hostel Commercial Laundry & Express Dry Wash',
    categorySlug: 'other',
    price: 75,
    durationMinutes: 60,
    capacity: 10,
    location: 'Hostel Block D, Basement Laundromat',
    description:
      'Industrial drum wash, hypoallergenic detergent, tumble dry, and steam pressing with same-day pickup assurance.',
    imageUrl:
      'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=800&q=80',
    providerName: 'Hostel Resident Services',
  },
  {
    name: 'High-Performance GPU Computing Cluster (NVIDIA A100)',
    categorySlug: 'laboratories',
    price: 650,
    durationMinutes: 180,
    capacity: 4,
    location: 'Computer Science Dept, Server Room 4',
    description:
      'High-throughput GPU server access for deep learning model training, PyTorch/TensorFlow simulations, and parallel rendering.',
    imageUrl:
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
    providerName: 'Department of Computing',
  },
];

/**
 * Auto-seeds default services if the table is completely empty
 */
async function autoSeedServicesIfEmpty() {
  const totalCount = await db.service.count();
  if (totalCount > 0) return;

  const categories = await db.serviceCategory.findMany();
  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]));

  for (const sample of SAMPLE_CAMPUS_SERVICES) {
    const categoryId = categoryMap.get(sample.categorySlug) || categories[0]?.id;
    if (!categoryId) continue;

    await db.service.create({
      data: {
        name: sample.name,
        categoryId,
        price: sample.price,
        durationMinutes: sample.durationMinutes,
        capacity: sample.capacity,
        location: sample.location,
        description: sample.description,
        imageUrl: sample.imageUrl,
        isActive: true,
      },
    });
  }
}

/**
 * Fetches all available services for students with search, category filtering,
 * price filtering, sorting, and pagination.
 *
 * SECURITY REQUIREMENT:
 * Strictly enforces `isActive: true` - inactive services are NEVER exposed to students.
 */
export async function getStudentServices(
  params: StudentServiceFilterParams = {}
): Promise<StudentServicesResult> {
  // Enforce student role authentication
  await requireStudent();

  // Auto-seed if database has 0 services
  await autoSeedServicesIfEmpty();

  const {
    q,
    category,
    price,
    minPrice,
    maxPrice,
    sort = 'featured',
    page = 1,
    pageSize = 9,
  } = params;

  // Base security where condition: strictly active services only
  const where: Prisma.ServiceWhereInput = {
    isActive: true,
  };

  // Search keyword filter
  if (q && q.trim()) {
    const query = q.trim();
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { location: { contains: query, mode: 'insensitive' } },
      { category: { name: { contains: query, mode: 'insensitive' } } },
      { provider: { name: { contains: query, mode: 'insensitive' } } },
    ];
  }

  // Category filter
  if (category && category !== 'all') {
    where.category = {
      OR: [{ slug: category }, { id: category }],
    };
  }

  // Price tier filter
  if (price && price !== 'all') {
    if (price === 'free') {
      where.price = 0;
    } else if (price === 'under-100') {
      where.price = { gt: 0, lte: 100 };
    } else if (price === '100-500') {
      where.price = { gte: 100, lte: 500 };
    } else if (price === 'above-500') {
      where.price = { gte: 500 };
    }
  } else if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {
      ...(minPrice !== undefined ? { gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
    };
  }

  // Sorting
  let orderBy: Prisma.ServiceOrderByWithRelationInput = { createdAt: 'desc' };

  switch (sort) {
    case 'price-asc':
      orderBy = { price: 'asc' };
      break;
    case 'price-desc':
      orderBy = { price: 'desc' };
      break;
    case 'popular':
      orderBy = { bookings: { _count: 'desc' } };
      break;
    case 'newest':
      orderBy = { createdAt: 'desc' };
      break;
    case 'rating':
    case 'featured':
    default:
      orderBy = { createdAt: 'desc' };
      break;
  }

  // Safe pagination
  const currentPage = Math.max(1, Number(page) || 1);
  const take = Math.min(50, Math.max(1, Number(pageSize) || 9));
  const skip = (currentPage - 1) * take;

  // Execute database queries in parallel
  const [totalCount, servicesRaw, categoriesRaw] = await Promise.all([
    db.service.count({ where }),
    db.service.findMany({
      where,
      orderBy,
      take,
      skip,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
        availabilities: {
          where: { isActive: true },
          take: 3,
          select: {
            dayOfWeek: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    }),
    db.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            services: {
              where: { isActive: true },
            },
          },
        },
      },
    }),
  ]);

  // Aggregate price counts across all active services (independent of search filters for facet UI)
  const [freeCount, under100Count, between100And500Count, above500Count, allActiveCount] =
    await Promise.all([
      db.service.count({ where: { isActive: true, price: 0 } }),
      db.service.count({ where: { isActive: true, price: { gt: 0, lte: 100 } } }),
      db.service.count({ where: { isActive: true, price: { gte: 100, lte: 500 } } }),
      db.service.count({ where: { isActive: true, price: { gte: 500 } } }),
      db.service.count({ where: { isActive: true } }),
    ]);

  // Format services items
  const formattedServices: StudentServiceItem[] = servicesRaw.map((s) => {
    const ratings = s.reviews.map((r) => r.rating);
    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    let availabilityLabel = `${s.durationMinutes} mins slot`;
    if (s.availabilities && s.availabilities.length > 0) {
      availabilityLabel = `Available ${s.availabilities.length} days/wk (${s.durationMinutes}m)`;
    }

    return {
      id: s.id,
      name: s.name,
      description: s.description,
      price: s.price,
      durationMinutes: s.durationMinutes,
      capacity: s.capacity,
      location: s.location,
      imageUrl: s.imageUrl,
      categoryId: s.categoryId,
      categoryName: s.category?.name || 'General Campus Service',
      categorySlug: s.category?.slug || 'other',
      categoryIcon: s.category?.icon || null,
      providerName: s.provider?.name || 'Verified Campus Provider',
      providerAvatarUrl: s.provider?.avatarUrl || null,
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: s._count.reviews,
      totalBookings: s._count.bookings,
      availabilityLabel,
      createdAt: s.createdAt.toISOString(),
    };
  });

  const totalPages = Math.ceil(totalCount / take) || 1;

  return {
    services: formattedServices,
    total: totalCount,
    page: currentPage,
    pageSize: take,
    totalPages,
    categories: categoriesRaw.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      count: c._count.services,
    })),
    priceCounts: {
      all: allActiveCount,
      free: freeCount,
      under100: under100Count,
      between100And500: between100And500Count,
      above500: above500Count,
    },
  };
}

/**
 * Helper to parse time strings like "09:00", "09:00 AM", "02:30 PM" into minutes from midnight (0-1439).
 */
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const cleaned = timeStr.trim();
  const isPM = /pm/i.test(cleaned);
  const isAM = /am/i.test(cleaned);
  const numericParts = cleaned.replace(/[^\d:]/g, '').split(':').map(Number);
  let h = numericParts[0] || 0;
  const m = numericParts[1] || 0;

  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;

  return h * 60 + m;
}

/**
 * Calculates authentic available dates and slot windows for the next 7 days.
 * Strictly respects:
 *  - Provider weekly operating days & time windows
 *  - Provider blocked dates & partial-day maintenance windows
 *  - Existing booking counts against service/slot capacity
 *  - Eliminates already-elapsed time slots for today
 *
 * NOTE: Students MUST only see slots that are currently available.
 */
function generateServiceSchedule(
  availabilities: Array<{
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    slotDuration: number;
    maxBookingsPerSlot?: number;
    isActive?: boolean;
  }>,
  blockedPeriods: Array<{
    startDate: Date;
    endDate: Date;
    startTime: string | null;
    endTime: string | null;
    isFullDay: boolean;
    reason: string | null;
  }>,
  existingBookings: Array<{
    scheduledAt: Date;
    slotTime: string | null;
  }>,
  defaultDurationMinutes: number,
  defaultCapacity: number
): ServiceAvailableDate[] {
  const result: ServiceAvailableDate[] = [];
  const daysMap = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  for (let i = 0; i < 7; i++) {
    const current = new Date(now);
    current.setDate(now.getDate() + i);

    const dayName = daysMap[current.getDay()];
    const dateString = current.toISOString().split('T')[0];
    const displayDate = current.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    const relativeLabel = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : '';

    // 1. Check if the entire date is blocked by provider full-day block
    const isFullDayBlocked = blockedPeriods.some((bp) => {
      if (!bp.isFullDay) return false;
      const startStr = bp.startDate.toISOString().split('T')[0];
      const endStr = bp.endDate.toISOString().split('T')[0];
      return dateString >= startStr && dateString <= endStr;
    });

    if (isFullDayBlocked) {
      result.push({
        dateString,
        displayDate,
        relativeLabel,
        dayOfWeek: dayName,
        isAvailable: false,
        slots: [],
      });
      continue;
    }

    // 2. Check weekly recurring availability for this day of week
    const dayAvail = availabilities.find((a) => a.dayOfWeek === dayName);

    // If day is disabled or no custom availability on Sunday, mark closed
    if (dayAvail?.isActive === false || (!dayAvail && dayName === 'SUNDAY')) {
      result.push({
        dateString,
        displayDate,
        relativeLabel,
        dayOfWeek: dayName,
        isAvailable: false,
        slots: [],
      });
      continue;
    }

    let startHour = 9;
    let endHour = 18;
    const slotDuration = dayAvail?.slotDuration || defaultDurationMinutes || 30;
    const slotCapacity = dayAvail?.maxBookingsPerSlot || defaultCapacity || 1;

    if (dayAvail) {
      const [sh] = dayAvail.startTime.split(':').map(Number);
      const [eh] = dayAvail.endTime.split(':').map(Number);
      if (!isNaN(sh)) startHour = sh;
      if (!isNaN(eh)) endHour = eh;
    }

    const slots: ServiceTimeSlot[] = [];
    let currentMin = startHour * 60;
    const endMin = endHour * 60;

    while (currentMin + slotDuration <= endMin) {
      const sh = Math.floor(currentMin / 60);
      const sm = currentMin % 60;
      const eh = Math.floor((currentMin + slotDuration) / 60);
      const em = (currentMin + slotDuration) % 60;

      const formatTime = (h: number, m: number) => {
        const period = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 === 0 ? 12 : h % 12;
        return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
      };

      const timeWindow = `${formatTime(sh, sm)} - ${formatTime(eh, em)}`;
      const period: 'Morning' | 'Afternoon' | 'Evening' =
        sh < 12 ? 'Morning' : sh < 17 ? 'Afternoon' : 'Evening';

      // Check partial-day blocked maintenance period
      const isSlotBlocked = blockedPeriods.some((bp) => {
        if (bp.isFullDay) return false;
        const startStr = bp.startDate.toISOString().split('T')[0];
        const endStr = bp.endDate.toISOString().split('T')[0];
        if (dateString < startStr || dateString > endStr) return false;
        if (!bp.startTime || !bp.endTime) return false;

        const bStart = parseTimeToMinutes(bp.startTime);
        const bEnd = parseTimeToMinutes(bp.endTime);
        // Overlap: slot start < block end AND slot end > block start
        return currentMin < bEnd && (currentMin + slotDuration) > bStart;
      });

      // Count existing active bookings for this date and timeWindow
      const bookingsForSlot = existingBookings.filter((b) => {
        const bDate = b.scheduledAt.toISOString().split('T')[0];
        return bDate === dateString && b.slotTime === timeWindow;
      }).length;

      // Filter out slots that have already passed if date is today (+15m buffer)
      const isPastSlot = i === 0 && currentMin <= nowMinutes + 15;

      const isSlotAvailable = !isSlotBlocked && bookingsForSlot < slotCapacity && !isPastSlot;

      // Requirement: Students must ONLY see available slots
      if (isSlotAvailable) {
        slots.push({
          id: `slot-${dateString}-${sh}-${sm}`,
          timeWindow,
          period,
          isAvailable: true,
        });
      }

      currentMin += slotDuration;
    }

    result.push({
      dateString,
      displayDate,
      relativeLabel,
      dayOfWeek: dayName,
      isAvailable: slots.length > 0,
      slots,
    });
  }

  return result;
}

/**
 * Fetches single service details for the student service page.
 * SECURITY: Enforces `isActive: true` - inactive services return null (notFound).
 */
export async function getStudentServiceDetailById(
  serviceId: string
): Promise<StudentServiceDetail | null> {
  await requireStudent();
  await autoSeedServicesIfEmpty();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const service = await db.service.findFirst({
    where: {
      id: serviceId,
      isActive: true, // Strictly active services only
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          description: true,
        },
      },
      provider: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatarUrl: true,
          createdAt: true,
        },
      },
      availabilities: {
        where: { isActive: true },
        select: {
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          slotDuration: true,
          maxBookingsPerSlot: true,
          isActive: true,
        },
      },
      blockedPeriods: {
        select: {
          startDate: true,
          endDate: true,
          startTime: true,
          endTime: true,
          reason: true,
          isFullDay: true,
        },
      },
      bookings: {
        where: {
          status: {
            in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS],
          },
          scheduledAt: {
            gte: todayStart,
          },
        },
        select: {
          scheduledAt: true,
          slotTime: true,
        },
      },
      reviews: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
      _count: {
        select: {
          bookings: true,
          reviews: true,
        },
      },
    },
  });

  if (!service) {
    return null;
  }

  // Calculate review metrics & breakdown
  const ratings = service.reviews.map((r) => r.rating);
  const totalReviews = ratings.length;
  const avgRating = totalReviews > 0 ? ratings.reduce((a, b) => a + b, 0) / totalReviews : 0;

  const ratingBreakdown = {
    5: ratings.filter((r) => r === 5).length,
    4: ratings.filter((r) => r === 4).length,
    3: ratings.filter((r) => r === 3).length,
    2: ratings.filter((r) => r === 2).length,
    1: ratings.filter((r) => r === 1).length,
  };

  // Generate availability schedule with authentic blocked periods and capacity checks
  const availableDates = generateServiceSchedule(
    service.availabilities,
    service.blockedPeriods,
    service.bookings,
    service.durationMinutes,
    service.capacity
  );

  let availabilityLabel = `${service.durationMinutes} mins slot`;
  if (service.availabilities && service.availabilities.length > 0) {
    availabilityLabel = `Available ${service.availabilities.length} days/wk (${service.durationMinutes}m)`;
  }

  const reviewsList: ServiceReviewItem[] = service.reviews.map((r) => ({
    id: r.id,
    studentName: r.user?.name || 'Verified Campus Student',
    studentAvatar: r.user?.avatarUrl || null,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  }));

  return {
    id: service.id,
    name: service.name,
    description: service.description,
    price: service.price,
    durationMinutes: service.durationMinutes,
    capacity: service.capacity,
    location: service.location,
    imageUrl: service.imageUrl,
    categoryId: service.categoryId,
    categoryName: service.category?.name || 'General Campus Service',
    categorySlug: service.category?.slug || 'other',
    categoryIcon: service.category?.icon || null,
    categoryDescription: service.category?.description || null,
    providerName: service.provider?.name || 'Campus Operations & Student Services Hub',
    providerAvatarUrl: service.provider?.avatarUrl || null,
    providerEmail: service.provider?.email || 'operations@campus.edu',
    providerPhone: service.provider?.phone || '+91 11 2659 1000',
    rating: avgRating > 0 ? Math.round(avgRating * 10) / 10 : 0,
    reviewCount: totalReviews,
    totalBookings: service._count.bookings,
    availabilityLabel,
    createdAt: service.createdAt.toISOString(),
    ratingBreakdown,
    reviews: reviewsList,
    availableDates,
  };
}

import { createBooking } from '@/app/actions/booking-actions';

/**
 * Creates a confirmed booking for the student.
 * Delegates to centralized atomic booking engine.
 */
export async function createStudentBooking(data: {
  serviceId: string;
  scheduledAt: string; // YYYY-MM-DD or ISO string
  slotTime: string; // e.g., "09:00 AM - 09:30 AM"
  location?: string;
  notes?: string;
}): Promise<{
  success: boolean;
  error?: string;
  booking?: {
    id: string;
    bookingCode: string;
    serviceName: string;
    amount: number;
    scheduledAt: string;
    slotTime: string;
    location: string;
  };
}> {
  const res = await createBooking({
    serviceId: data.serviceId,
    scheduledAt: data.scheduledAt,
    slotTime: data.slotTime,
    notes: data.notes,
  });

  if (!res.success || !res.booking) {
    return { success: false, error: res.error || 'Failed to complete booking.' };
  }

  return {
    success: true,
    booking: {
      id: res.booking.id,
      bookingCode: res.booking.bookingCode,
      serviceName: res.booking.service.name,
      amount: res.booking.amount,
      scheduledAt: res.booking.scheduledAt,
      slotTime: res.booking.slotTime,
      location: res.booking.location,
    },
  };
}

