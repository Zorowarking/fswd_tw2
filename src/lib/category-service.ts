import { db } from '@/lib/db';

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  serviceCount: number;
}

/**
 * Returns all active categories for public browsing, filters, and provider forms.
 */
export async function getActiveCategories(): Promise<CategorySummary[]> {
  const categories = await db.serviceCategory.findMany({
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
  });

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    icon: c.icon,
    isActive: c.isActive,
    serviceCount: c._count.services,
  }));
}

/**
 * Fetches a single category by slug along with its active services.
 */
export async function getCategoryBySlug(slug: string) {
  return db.serviceCategory.findUnique({
    where: { slug },
    include: {
      services: {
        where: { isActive: true },
        include: {
          provider: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });
}
