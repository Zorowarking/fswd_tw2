import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-role';
import { categorySchema, generateSlug } from '@/lib/validations/category';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let showAll = false;

    // Only verified administrators may view inactive categories
    if (searchParams.get('all') === 'true') {
      try {
        await requireAdmin();
        showAll = true;
      } catch {
        showAll = false;
      }
    }

    const categories = await db.serviceCategory.findMany({
      where: showAll ? undefined : { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { services: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        icon: c.icon,
        isActive: c.isActive,
        serviceCount: c._count.services,
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch categories';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Only administrators can create categories
    await requireAdmin();

    const body = await request.json();
    const validated = categorySchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: validated.error.issues[0]?.message || 'Invalid category payload',
        },
        { status: 400 }
      );
    }

    const { name, slug, description, icon, isActive } = validated.data;
    const finalSlug = slug || generateSlug(name);

    // Uniqueness checks
    const existing = await db.serviceCategory.findFirst({
      where: {
        OR: [{ slug: finalSlug }, { name }],
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: existing.slug === finalSlug ? 'Slug already in use' : 'Category name already in use',
        },
        { status: 409 }
      );
    }

    const category = await db.serviceCategory.create({
      data: {
        name,
        slug: finalSlug,
        description: description || null,
        icon: icon || 'HelpCircle',
        isActive: isActive !== false,
      },
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Forbidden or server error';
    return NextResponse.json({ success: false, error: message }, { status: 403 });
  }
}
