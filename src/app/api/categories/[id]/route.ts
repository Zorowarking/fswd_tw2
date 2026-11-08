import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-role';
import { categorySchema, generateSlug } from '@/lib/validations/category';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    // Only administrators can update categories
    await requireAdmin();
    const { id } = await context.params;

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

    // Conflict check
    const existing = await db.serviceCategory.findFirst({
      where: {
        NOT: { id },
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

    const updated = await db.serviceCategory.update({
      where: { id },
      data: {
        name,
        slug: finalSlug,
        description: description || null,
        icon: icon || null,
        isActive,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Forbidden or server error';
    return NextResponse.json({ success: false, error: message }, { status: 403 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    // Only administrators can delete categories
    await requireAdmin();
    const { id } = await context.params;

    const category = await db.serviceCategory.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }

    await db.serviceCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, data: { id } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Forbidden or server error';
    return NextResponse.json({ success: false, error: message }, { status: 403 });
  }
}
