'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-role';
import {
  categorySchema,
  type CategoryFormData,
  generateSlug,
  EXAMPLE_CATEGORIES,
} from '@/lib/validations/category';

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  serviceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Fetches all categories for the Admin Management Console.
 * Strictly guarded: only Role.ADMIN permitted.
 */
export async function getAdminCategories(): Promise<CategoryItem[]> {
  await requireAdmin();

  // If table is empty, auto-seed default categories for immediate utility
  const count = await db.serviceCategory.count();
  if (count === 0) {
    await seedExampleCategoriesInternal();
  }

  const categories = await db.serviceCategory.findMany({
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    include: {
      _count: {
        select: { services: true },
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
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));
}

/**
 * Internal auto-seeder for default campus categories
 */
async function seedExampleCategoriesInternal() {
  for (const cat of EXAMPLE_CATEGORIES) {
    await db.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        isActive: true,
      },
    });
  }
}

/**
 * Public/Callable action to seed or re-seed example categories.
 * Strictly guarded: only Role.ADMIN permitted.
 */
export async function seedExampleCategoriesAction(): Promise<ActionResponse<{ count: number }>> {
  try {
    await requireAdmin();
    let createdCount = 0;

    for (const cat of EXAMPLE_CATEGORIES) {
      const existing = await db.serviceCategory.findUnique({
        where: { slug: cat.slug },
      });

      if (!existing) {
        await db.serviceCategory.create({
          data: {
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            icon: cat.icon,
            isActive: true,
          },
        });
        createdCount++;
      }
    }

    revalidatePath('/admin/categories');
    revalidatePath('/admin/dashboard');
    return { success: true, data: { count: createdCount } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to seed example categories';
    return { success: false, error: message };
  }
}

/**
 * Creates a new category.
 * Strictly guarded: only Role.ADMIN permitted.
 */
export async function createCategory(
  formData: CategoryFormData
): Promise<ActionResponse<CategoryItem>> {
  try {
    await requireAdmin();

    const validated = categorySchema.safeParse(formData);
    if (!validated.success) {
      const firstError = validated.error.issues[0]?.message || 'Invalid category data';
      return { success: false, error: firstError };
    }

    const { name, slug, description, icon, isActive } = validated.data;
    const finalSlug = slug || generateSlug(name);

    // Check slug and name collision
    const existingSlug = await db.serviceCategory.findUnique({
      where: { slug: finalSlug },
    });
    if (existingSlug) {
      return { success: false, error: `A category with slug "${finalSlug}" already exists.` };
    }

    const existingName = await db.serviceCategory.findUnique({
      where: { name },
    });
    if (existingName) {
      return { success: false, error: `A category named "${name}" already exists.` };
    }

    const created = await db.serviceCategory.create({
      data: {
        name,
        slug: finalSlug,
        description: description || null,
        icon: icon || 'HelpCircle',
        isActive,
      },
      include: {
        _count: {
          select: { services: true },
        },
      },
    });

    revalidatePath('/admin/categories');
    revalidatePath('/admin/dashboard');

    return {
      success: true,
      data: {
        id: created.id,
        name: created.name,
        slug: created.slug,
        description: created.description,
        icon: created.icon,
        isActive: created.isActive,
        serviceCount: created._count.services,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create category';
    return { success: false, error: message };
  }
}

/**
 * Updates an existing category.
 * Strictly guarded: only Role.ADMIN permitted.
 */
export async function updateCategory(
  id: string,
  formData: CategoryFormData
): Promise<ActionResponse<CategoryItem>> {
  try {
    await requireAdmin();

    const validated = categorySchema.safeParse(formData);
    if (!validated.success) {
      const firstError = validated.error.issues[0]?.message || 'Invalid category data';
      return { success: false, error: firstError };
    }

    const { name, slug, description, icon, isActive } = validated.data;
    const finalSlug = slug || generateSlug(name);

    // Check slug collision with other records
    const existingSlug = await db.serviceCategory.findFirst({
      where: {
        slug: finalSlug,
        NOT: { id },
      },
    });
    if (existingSlug) {
      return { success: false, error: `A category with slug "${finalSlug}" already exists.` };
    }

    // Check name collision with other records
    const existingName = await db.serviceCategory.findFirst({
      where: {
        name,
        NOT: { id },
      },
    });
    if (existingName) {
      return { success: false, error: `A category named "${name}" already exists.` };
    }

    const updated = await db.serviceCategory.update({
      where: { id },
      data: {
        name,
        slug: finalSlug,
        description: description || null,
        icon: icon || null,
        isActive,
      },
      include: {
        _count: {
          select: { services: true },
        },
      },
    });

    revalidatePath('/admin/categories');
    revalidatePath('/admin/dashboard');

    return {
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        description: updated.description,
        icon: updated.icon,
        isActive: updated.isActive,
        serviceCount: updated._count.services,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update category';
    return { success: false, error: message };
  }
}

/**
 * Toggles category active status.
 * Strictly guarded: only Role.ADMIN permitted.
 */
export async function toggleCategoryStatus(id: string): Promise<ActionResponse<{ isActive: boolean }>> {
  try {
    await requireAdmin();

    const category = await db.serviceCategory.findUnique({
      where: { id },
      select: { isActive: true },
    });

    if (!category) {
      return { success: false, error: 'Category not found.' };
    }

    const updated = await db.serviceCategory.update({
      where: { id },
      data: { isActive: !category.isActive },
      select: { isActive: true },
    });

    revalidatePath('/admin/categories');
    revalidatePath('/admin/dashboard');

    return { success: true, data: { isActive: updated.isActive } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to toggle category status';
    return { success: false, error: message };
  }
}

/**
 * Deletes a category.
 * If services are linked, unlinks them safely (categoryId set to null) per schema onDelete: SetNull.
 * Strictly guarded: only Role.ADMIN permitted.
 */
export async function deleteCategory(id: string): Promise<ActionResponse<{ id: string }>> {
  try {
    await requireAdmin();

    const category = await db.serviceCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { services: true } },
      },
    });

    if (!category) {
      return { success: false, error: 'Category not found.' };
    }

    // Safely delete category
    await db.serviceCategory.delete({
      where: { id },
    });

    revalidatePath('/admin/categories');
    revalidatePath('/admin/dashboard');

    return { success: true, data: { id } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete category';
    return { success: false, error: message };
  }
}
