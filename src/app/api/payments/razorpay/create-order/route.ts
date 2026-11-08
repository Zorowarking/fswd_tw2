import { NextResponse } from 'next/server';
import { createRazorpayOrderAction } from '@/app/actions/payment-actions';

/**
 * Razorpay Order Creation API Route (Server-Side)
 *
 * SECURE ORDER CREATION:
 * 1. Strictly authenticated students only.
 * 2. Amount is securely calculated server-side from active service. Price sent by client is rejected/ignored.
 * 3. Creates PENDING booking and PENDING payment in Prisma to guarantee state tracking.
 * 4. Razorpay secret is never exposed.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { serviceId, scheduledAt, slotTime, notes } = body;

    if (!serviceId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: serviceId.' },
        { status: 400 }
      );
    }

    if (!scheduledAt || !slotTime) {
      return NextResponse.json(
        { success: false, error: 'Missing scheduled date or slot time.' },
        { status: 400 }
      );
    }

    const result = await createRazorpayOrderAction({
      serviceId,
      scheduledAt,
      slotTime,
      notes,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to create Razorpay test order.' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create Razorpay test order';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
