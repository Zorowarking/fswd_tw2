'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireStudent } from '@/lib/auth-role';
import {
  createRazorpayOrderOnGateway,
  validateRazorpayTestMode,
  verifyRazorpayPaymentSignature,
  generateTestRazorpaySignature,
} from '@/lib/razorpay';
import {
  createBooking,
  type BookingResponseData,
} from '@/app/actions/booking-actions';
import { PaymentStatus, PaymentMethod, BookingStatus, Booking, NotificationType } from '@prisma/client';

export interface CreateRazorpayOrderInput {
  serviceId: string;
  scheduledAt: string; // YYYY-MM-DD
  slotTime: string; // "09:00 AM - 09:30 AM"
  notes?: string;
  // NOTE: Price/amount is never accepted from client
}

export interface RazorpayOrderResult {
  success: boolean;
  error?: string;
  isFree?: boolean;
  order?: {
    id: string;
    amount: number; // in paise
    currency: string;
    receipt: string;
  };
  keyId?: string; // Public test key only
  bookingId?: string;
  bookingCode?: string;
  service?: {
    id: string;
    name: string;
    price: number;
    durationMinutes: number;
    location: string | null;
  };
  student?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
}

export interface VerifyPaymentInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  serviceId: string;
  scheduledAt: string;
  slotTime: string;
  notes?: string;
  bookingId?: string;
}

export interface VerifyPaymentResult {
  success: boolean;
  error?: string;
  booking?: BookingResponseData;
  paymentId?: string;
  paymentStatus?: PaymentStatus;
}

type BookingWithDetails = Booking & {
  student: { id: string; name: string | null; email: string; phone: string | null; role: string | null } | null;
  service: {
    name: string;
    durationMinutes: number;
    location: string | null;
    category: { name: string } | null;
    provider: { id: string; name: string | null; email: string; phone: string | null } | null;
  };
};

/**
 * Helper to format booking response payload consistently
 */
function formatBookingResult(b: BookingWithDetails): BookingResponseData {
  return {
    id: b.id,
    bookingCode: b.bookingCode,
    status: b.status,
    amount: b.amount,
    scheduledAt: b.scheduledAt.toISOString(),
    slotTime: b.slotTime || 'Standard Slot',
    location: b.location || 'Campus Facilities',
    notes: b.notes,
    createdAt: b.createdAt.toISOString(),
    student: {
      id: b.student?.id || b.studentId || '',
      name: b.student?.name || 'Verified Student',
      email: b.student?.email || '',
      phone: b.student?.phone || null,
      role: b.student?.role || 'STUDENT',
    },
    provider: {
      id: b.service?.provider?.id || 'campus-provider',
      name: b.service?.provider?.name || 'Campus Operations Desk',
      email: b.service?.provider?.email || 'operations@campus.edu',
      phone: b.service?.provider?.phone || null,
    },
    service: {
      id: b.serviceId,
      name: b.service?.name || 'Campus Service',
      categoryName: b.service?.category?.name || 'General Campus Service',
      durationMinutes: b.service?.durationMinutes || 30,
      location: b.service?.location || 'Campus Facility',
      price: b.amount,
    },
  };
}

/**
 * Server Action: Creates a Razorpay Order in TEST mode.
 * Securely calculates amount server-side and registers a PENDING Booking and PENDING Payment.
 *
 * State:
 * Booking = PENDING (unpaid)
 * Payment = PENDING (awaiting payment)
 */
export async function createRazorpayOrderAction(
  input: CreateRazorpayOrderInput
): Promise<RazorpayOrderResult> {
  try {
    const studentUser = await requireStudent();

    if (!input.serviceId) {
      return { success: false, error: 'Service ID is required.' };
    }

    // 1. Query service and calculate amount securely on the server
    const service = await db.service.findFirst({
      where: {
        id: input.serviceId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        price: true,
        durationMinutes: true,
        location: true,
      },
    });

    if (!service) {
      return { success: false, error: 'Service not found or is currently inactive.' };
    }

    const basePrice = Math.max(0, Number(service.price) || 0);

    // 2. Free services flow (zero amount: automatically confirmed)
    if (basePrice === 0) {
      const freeBooking = await createBooking({
        serviceId: service.id,
        scheduledAt: input.scheduledAt,
        slotTime: input.slotTime,
        notes: input.notes,
        status: BookingStatus.CONFIRMED,
      });

      if (!freeBooking.success || !freeBooking.booking) {
        return { success: false, error: freeBooking.error || 'Failed to issue free grant pass.' };
      }

      // Record successful zero-fee payment
      const paymentCode = `PAY-${Math.floor(100000 + Math.random() * 900000)}`;
      await db.payment.create({
        data: {
          paymentCode,
          bookingId: freeBooking.booking.id,
          userId: studentUser.id,
          amount: 0,
          currency: 'INR',
          status: PaymentStatus.SUCCESSFUL,
          method: PaymentMethod.CAMPUS_WALLET,
          paidAt: new Date(),
        },
      });

      return {
        success: true,
        isFree: true,
        bookingId: freeBooking.booking.id,
        bookingCode: freeBooking.booking.bookingCode,
        order: {
          id: 'free_grant_order',
          amount: 0,
          currency: 'INR',
          receipt: `rcpt_free_${Date.now()}`,
        },
        service: {
          id: service.id,
          name: service.name,
          price: 0,
          durationMinutes: service.durationMinutes,
          location: service.location,
        },
      };
    }

    // 3. Paid services: Create PENDING Booking and PENDING Payment
    const pendingBooking = await createBooking({
      serviceId: service.id,
      scheduledAt: input.scheduledAt,
      slotTime: input.slotTime,
      notes: input.notes,
      status: BookingStatus.PENDING, // Booking remains unpaid/pending until payment succeeds
    });

    if (!pendingBooking.success || !pendingBooking.booking) {
      return {
        success: false,
        error: pendingBooking.error || 'Failed to initialize pending reservation slot.',
      };
    }

    // Subunits calculation: 1 INR = 100 paise
    const amountInPaise = Math.round(basePrice * 100);
    const receipt = `rcpt_${Date.now().toString(36)}_${Math.floor(1000 + Math.random() * 9000)}`;

    const { keyId } = validateRazorpayTestMode();

    // Call Razorpay Order Generation
    const order = await createRazorpayOrderOnGateway({
      amountInPaise,
      currency: 'INR',
      receipt,
      notes: {
        bookingId: pendingBooking.booking.id,
        serviceId: service.id,
        serviceName: service.name,
        studentId: studentUser.id,
        scheduledAt: input.scheduledAt,
        slotTime: input.slotTime,
        testMode: 'true',
      },
    });

    // Record PENDING Payment in Prisma
    const paymentCode = `PAY-${Math.floor(100000 + Math.random() * 900000)}`;
    await db.payment.create({
      data: {
        paymentCode,
        bookingId: pendingBooking.booking.id,
        userId: studentUser.id,
        amount: basePrice,
        currency: 'INR',
        status: PaymentStatus.PENDING, // Payment = PENDING
        method: PaymentMethod.UPI,
        orderId: order.id,
      },
    });

    return {
      success: true,
      isFree: false,
      bookingId: pendingBooking.booking.id,
      bookingCode: pendingBooking.booking.bookingCode,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      },
      keyId, // Only public Test Key ID, secret is NEVER returned
      service: {
        id: service.id,
        name: service.name,
        price: basePrice,
        durationMinutes: service.durationMinutes,
        location: service.location,
      },
      student: {
        id: studentUser.id,
        name: studentUser.name || 'Campus Student',
        email: studentUser.email,
        phone: studentUser.phone || null,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create Razorpay test order';
    return { success: false, error: message };
  }
}

/**
 * Server Action: Verifies Razorpay payment signature and updates payment/booking state.
 *
 * CONSISTENCY GUARANTEE:
 * - If payment succeeds:
 *     Payment = SUCCESSFUL
 *     Booking = CONFIRMED
 * - If payment fails:
 *     Payment = FAILED
 *     Booking remains PENDING (unpaid)
 *
 * DUPLICATE PREVENTION:
 * - Idempotency check against razorpayPaymentId (transactionId is @unique)
 * - Checks if order is already marked as SUCCESSFUL
 */
export async function verifyAndConfirmPayment(
  input: VerifyPaymentInput
): Promise<VerifyPaymentResult> {
  try {
    const studentUser = await requireStudent();

    // 1. PREVENT DUPLICATE PAYMENT RECORDS
    // Check if this payment transaction or order has already succeeded
    const existingSuccessfulPayment = await db.payment.findFirst({
      where: {
        OR: [
          { transactionId: input.razorpayPaymentId },
          { orderId: input.razorpayOrderId, status: PaymentStatus.SUCCESSFUL },
        ],
      },
      include: {
        booking: {
          include: {
            student: { select: { id: true, name: true, email: true, phone: true, role: true } },
            service: {
              include: {
                category: { select: { name: true } },
                provider: { select: { id: true, name: true, email: true, phone: true } },
              },
            },
          },
        },
      },
    });

    if (existingSuccessfulPayment) {
      if (existingSuccessfulPayment.userId !== studentUser.id) {
        return {
          success: false,
          error: 'Unauthorized: This payment transaction does not belong to your account.',
        };
      }
      if (
        existingSuccessfulPayment.status === PaymentStatus.SUCCESSFUL &&
        existingSuccessfulPayment.booking
      ) {
        // Duplicate payment detected — return already confirmed booking safely
        return {
          success: true,
          booking: formatBookingResult(existingSuccessfulPayment.booking),
          paymentId: existingSuccessfulPayment.id,
          paymentStatus: PaymentStatus.SUCCESSFUL,
        };
      }
    }

    // 2. CRYPTOGRAPHIC SIGNATURE VERIFICATION (SERVER-SIDE)
    const isSignatureValid = verifyRazorpayPaymentSignature({
      orderId: input.razorpayOrderId,
      paymentId: input.razorpayPaymentId,
      signature: input.razorpaySignature,
    });

    // 3. IF PAYMENT FAILS (SIGNATURE INVALID):
    // Payment = FAILED
    // Booking remains PENDING (unpaid)
    if (!isSignatureValid) {
      const updateResult = await db.payment.updateMany({
        where: { orderId: input.razorpayOrderId },
        data: {
          status: PaymentStatus.FAILED,
          transactionId: input.razorpayPaymentId,
          signature: input.razorpaySignature,
        },
      });

      // If no existing payment record was linked to this order, register a failed payment record
      if (updateResult.count === 0 && (input.bookingId || input.serviceId)) {
        let bookingId = input.bookingId;
        if (!bookingId) {
          const pendingBooking = await db.booking.findFirst({
            where: {
              studentId: studentUser.id,
              serviceId: input.serviceId,
              status: BookingStatus.PENDING,
            },
            orderBy: { createdAt: 'desc' },
          });
          bookingId = pendingBooking?.id;
        }

        if (bookingId) {
          const paymentCode = `PAY-${Math.floor(100000 + Math.random() * 900000)}`;
          await db.payment.create({
            data: {
              paymentCode,
              bookingId,
              userId: studentUser.id,
              amount: 0,
              currency: 'INR',
              status: PaymentStatus.FAILED,
              method: PaymentMethod.UPI,
              transactionId: input.razorpayPaymentId,
              orderId: input.razorpayOrderId,
              signature: input.razorpaySignature,
            },
          }).catch(() => {});
        }
      }

      return {
        success: false,
        error:
          'Payment cryptographic signature verification failed. Untrusted payment payload. Booking remains unpaid.',
        paymentStatus: PaymentStatus.FAILED,
      };
    }

    // 4. IF PAYMENT SUCCEEDS:
    // Execute atomic transaction for Payment = SUCCESSFUL and Booking = CONFIRMED
    const result = await db.$transaction(async (tx) => {
      // Find existing payment by orderId
      const pendingPayment = await tx.payment.findFirst({
        where: { orderId: input.razorpayOrderId },
        include: {
          booking: {
            include: {
              student: { select: { id: true, name: true, email: true, phone: true, role: true } },
              service: {
                include: {
                  category: { select: { name: true } },
                  provider: { select: { id: true, name: true, email: true, phone: true } },
                },
              },
            },
          },
        },
      });

      // Security: verify pendingPayment belongs to the authenticated student
      if (pendingPayment && pendingPayment.userId !== studentUser.id) {
        throw new Error('Unauthorized: This payment order does not belong to your account.');
      }

      let bookingId = pendingPayment?.bookingId || input.bookingId;
      let confirmedBookingRecord: BookingWithDetails | null = (pendingPayment?.booking as BookingWithDetails | null) || null;

      // If booking was passed but relation wasn't loaded via pendingPayment
      if (bookingId && !confirmedBookingRecord) {
        confirmedBookingRecord = (await tx.booking.findUnique({
          where: { id: bookingId },
          include: {
            student: { select: { id: true, name: true, email: true, phone: true, role: true } },
            service: {
              include: {
                category: { select: { name: true } },
                provider: { select: { id: true, name: true, email: true, phone: true } },
              },
            },
          },
        })) as BookingWithDetails | null;
      }

      // Security: verify booking belongs to the authenticated student
      if (confirmedBookingRecord && confirmedBookingRecord.studentId !== studentUser.id) {
        throw new Error('Unauthorized: You do not have ownership of this booking reservation.');
      }

      // If pending booking was created during order generation, confirm it
      if (bookingId && confirmedBookingRecord) {
        await tx.booking.update({
          where: { id: bookingId },
          data: {
            status: BookingStatus.CONFIRMED, // Booking = CONFIRMED
          },
        });
      } else {
        // If booking wasn't pre-created, create it atomically now
        const createdBooking = await createBooking({
          serviceId: input.serviceId,
          scheduledAt: input.scheduledAt,
          slotTime: input.slotTime,
          notes: input.notes,
          status: BookingStatus.CONFIRMED,
        });

        if (!createdBooking.success || !createdBooking.booking) {
          throw new Error(createdBooking.error || 'Failed to create confirmed booking.');
        }

        bookingId = createdBooking.booking.id;
        const freshBooking = await tx.booking.findUnique({
          where: { id: bookingId },
          include: {
            student: { select: { id: true, name: true, email: true, phone: true, role: true } },
            service: {
              include: {
                category: { select: { name: true } },
                provider: { select: { id: true, name: true, email: true, phone: true } },
              },
            },
          },
        });
        if (!freshBooking) throw new Error('Booking could not be loaded.');
        confirmedBookingRecord = freshBooking;
      }

      if (!confirmedBookingRecord) {
        throw new Error('Booking record could not be resolved or confirmed.');
      }

      // Update or create Payment record: Payment = SUCCESSFUL
      let paymentRecordId = pendingPayment?.id;

      if (pendingPayment) {
        const updated = await tx.payment.update({
          where: { id: pendingPayment.id },
          data: {
            status: PaymentStatus.SUCCESSFUL, // Payment = SUCCESSFUL
            transactionId: input.razorpayPaymentId,
            signature: input.razorpaySignature,
            paidAt: new Date(),
          },
        });
        paymentRecordId = updated.id;
      } else {
        const paymentCode = `PAY-${Math.floor(100000 + Math.random() * 900000)}`;
        const created = await tx.payment.create({
          data: {
            paymentCode,
            bookingId,
            userId: studentUser.id,
            amount: confirmedBookingRecord.amount,
            currency: 'INR',
            status: PaymentStatus.SUCCESSFUL, // Payment = SUCCESSFUL
            method: PaymentMethod.UPI,
            transactionId: input.razorpayPaymentId,
            orderId: input.razorpayOrderId,
            signature: input.razorpaySignature,
            paidAt: new Date(),
          },
        });
        paymentRecordId = created.id;
      }

      // Notification for Student: Payment Successful
      await tx.notification.create({
        data: {
          userId: studentUser.id,
          type: NotificationType.PAYMENT_SUCCESSFUL,
          title: 'Payment Successful',
          message: `Payment of ₹${confirmedBookingRecord.amount} for booking ${confirmedBookingRecord.bookingCode} (${confirmedBookingRecord.service.name}) was verified successfully.`,
          link: `/student/bookings/${bookingId}`,
        },
      });

      // Notification for Provider: Payment Completed
      if (confirmedBookingRecord.service?.provider?.id) {
        await tx.notification.create({
          data: {
            userId: confirmedBookingRecord.service.provider.id,
            type: NotificationType.PAYMENT_SUCCESSFUL,
            title: 'Payment Received',
            message: `Payment of ₹${confirmedBookingRecord.amount} completed for booking ${confirmedBookingRecord.bookingCode} (${confirmedBookingRecord.service.name}).`,
            link: '/provider/bookings',
          },
        });
      }

      return {
        booking: formatBookingResult(confirmedBookingRecord),
        paymentId: paymentRecordId,
      };
    }, {
      maxWait: 10000,
      timeout: 25000,
    });

    revalidatePath(`/student/services/${input.serviceId}`);
    revalidatePath('/student/dashboard');
    revalidatePath('/provider/dashboard');

    return {
      success: true,
      booking: result.booking,
      paymentId: result.paymentId,
      paymentStatus: PaymentStatus.SUCCESSFUL,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Payment verification failed';
    return { success: false, error: message };
  }
}

/**
 * Server Action: Records an explicit payment failure (e.g. card declined, user cancelled modal).
 *
 * CONSISTENCY:
 * - Payment = FAILED
 * - Booking remains PENDING (unpaid)
 */
export async function recordPaymentFailureAction(input: {
  orderId: string;
  paymentId?: string;
  reason?: string;
}): Promise<{ success: boolean; status: PaymentStatus; error?: string }> {
  try {
    const studentUser = await requireStudent();

    if (!input.orderId) {
      return { success: false, status: PaymentStatus.FAILED, error: 'Order ID is required.' };
    }

    // Update payment record to FAILED strictly scoped to authenticated student
    await db.payment.updateMany({
      where: {
        orderId: input.orderId,
        userId: studentUser.id,
      },
      data: {
        status: PaymentStatus.FAILED, // Payment = FAILED
        transactionId: input.paymentId || undefined,
      },
    });

    // Booking status remains PENDING (unpaid/pending)
    return { success: true, status: PaymentStatus.FAILED };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to record payment failure';
    return { success: false, status: PaymentStatus.FAILED, error: message };
  }
}

/**
 * Server Action: Generates an authentic HMAC-SHA256 test signature strictly for test-mode checkout simulation.
 * Prohibited in production, and strictly restricted to the student's own pending order.
 */
export async function generateTestSignatureAction(
  orderId: string,
  paymentId: string
): Promise<string> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Test signature generation is prohibited in production environments.');
  }

  const studentUser = await requireStudent();

  // Strict ownership check: ensure the order belongs to this student
  const payment = await db.payment.findFirst({
    where: {
      orderId,
      userId: studentUser.id,
    },
  });

  if (!payment) {
    throw new Error('Unauthorized: Payment order not found or does not belong to your account.');
  }

  return generateTestRazorpaySignature(orderId, paymentId);
}

/**
 * Retrieves all payment records associated with a specific booking.
 */
export async function getPaymentsForBooking(bookingId: string) {
  const studentUser = await requireStudent();

  return db.payment.findMany({
    where: {
      bookingId,
      userId: studentUser.id,
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      paymentCode: true,
      amount: true,
      currency: true,
      status: true,
      method: true,
      orderId: true,
      transactionId: true,
      signature: true,
      paidAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Retrieves payment details by order ID
 */
export async function getPaymentByOrderId(orderId: string) {
  const studentUser = await requireStudent();

  return db.payment.findFirst({
    where: {
      orderId,
      userId: studentUser.id,
    },
    include: {
      booking: {
        include: {
          service: {
            select: {
              name: true,
              location: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Retrieves a single payment record by ID
 */
export async function getPaymentDetails(paymentId: string) {
  const studentUser = await requireStudent();

  return db.payment.findFirst({
    where: {
      id: paymentId,
      userId: studentUser.id,
    },
    include: {
      booking: {
        include: {
          service: {
            select: {
              name: true,
              location: true,
            },
          },
        },
      },
    },
  });
}
