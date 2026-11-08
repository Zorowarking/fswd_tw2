import { NextResponse } from 'next/server';
import { recordPaymentFailureAction } from '@/app/actions/payment-actions';

/**
 * Razorpay Payment Failure API Route
 *
 * Ensures payment failure is recorded with status = FAILED while leaving booking = PENDING.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { orderId, paymentId, reason } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Missing orderId parameter.' },
        { status: 400 }
      );
    }

    const result = await recordPaymentFailureAction({
      orderId,
      paymentId,
      reason,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to record payment failure';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

