import { NextResponse } from 'next/server';
import { verifyAndConfirmPayment } from '@/app/actions/payment-actions';

/**
 * Razorpay Payment Verification API Route (Server-Side)
 *
 * CRITICAL SECURITY & CONSISTENCY INVARIANTS:
 * 1. Do NOT mark a booking as paid based only on frontend success.
 * 2. Cryptographically verifies HMAC-SHA256 signature using RAZORPAY_KEY_SECRET.
 * 3. Atomic state transitions:
 *    - Success: Payment = SUCCESSFUL, Booking = CONFIRMED
 *    - Failure: Payment = FAILED, Booking remains PENDING (unpaid)
 * 4. Stores bookingId, orderId, transactionId, signature, amount, currency, status, timestamps.
 * 5. Prevents duplicate payment records via unique transactionId and idempotent status checks.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      serviceId,
      scheduledAt,
      slotTime,
      notes,
      bookingId,
    } = body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Missing required payment verification parameters: order ID, payment ID, or signature.',
        },
        { status: 400 }
      );
    }

    if (!serviceId || !scheduledAt || !slotTime) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing service or reservation timing parameters.',
        },
        { status: 400 }
      );
    }

    const result = await verifyAndConfirmPayment({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      serviceId,
      scheduledAt,
      slotTime,
      notes,
      bookingId,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Payment verification failed.',
          paymentStatus: result.paymentStatus,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      paymentId: result.paymentId,
      paymentStatus: result.paymentStatus,
      booking: result.booking,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Payment verification error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
