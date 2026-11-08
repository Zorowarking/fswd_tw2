import { db } from '../src/lib/db';
import { Role, BookingStatus, PaymentStatus, PaymentMethod } from '@prisma/client';

async function verifyAdminBookings() {
  console.log('=== VERIFYING ADMIN BOOKINGS LEDGER SYSTEM ===\n');

  // 1. Create mock provider, student, service, booking, and payment
  const providerClerkId = `user_prov_bk_${Date.now()}`;
  const studentClerkId = `user_std_bk_${Date.now()}`;

  console.log('1. Setting up mock provider & student in Neon PostgreSQL...');
  const provider = await db.user.create({
    data: {
      clerkUserId: providerClerkId,
      name: 'Campus Express Laundry (Vendor)',
      email: `laundry.${Date.now()}@campusserve.edu`,
      phone: '+91 97777 88888',
      role: Role.SERVICE_PROVIDER,
    },
  });

  const student = await db.user.create({
    data: {
      clerkUserId: studentClerkId,
      name: 'Aditya Mehta (Student)',
      email: `aditya.${Date.now()}@campusserve.edu`,
      phone: '+91 98888 99999',
      role: Role.STUDENT,
    },
  });

  let category = await db.serviceCategory.findFirst();
  if (!category) {
    category = await db.serviceCategory.create({
      data: {
        name: 'Laundry & Fabric Care',
        slug: `laundry-care-${Date.now()}`,
      },
    });
  }

  const service = await db.service.create({
    data: {
      name: 'Premium Wash & Steam Press',
      price: 180,
      durationMinutes: 60,
      location: 'SAC Booth #108',
      capacity: 2,
      isActive: true,
      categoryId: category.id,
      providerId: provider.id,
    },
  });

  const bookingCode = `BK-ADMIN-TEST-${Date.now()}`;
  console.log(`2. Creating test booking with code: ${bookingCode}...`);
  const booking = await db.booking.create({
    data: {
      bookingCode,
      serviceId: service.id,
      studentId: student.id,
      status: BookingStatus.PENDING,
      amount: 180,
      scheduledAt: new Date(),
      slotTime: '10:00 AM - 11:00 AM',
      location: 'SAC Booth #108',
      notes: 'Please separate dark garments',
    },
  });

  console.log('3. Attaching payment transaction record...');
  const payment = await db.payment.create({
    data: {
      paymentCode: `PAY-TEST-${Date.now()}`,
      bookingId: booking.id,
      userId: student.id,
      amount: 180,
      currency: 'INR',
      status: PaymentStatus.SUCCESSFUL,
      method: PaymentMethod.UPI,
      transactionId: `pay_test_${Date.now()}`,
      orderId: `order_test_${Date.now()}`,
      paidAt: new Date(),
    },
  });

  // 4. Query bookings with relations
  console.log('4. Testing admin booking ledger query with complete relations...');
  const foundBooking = await db.booking.findUnique({
    where: { id: booking.id },
    include: {
      student: true,
      service: {
        include: {
          category: true,
          provider: true,
        },
      },
      payments: true,
    },
  });

  if (!foundBooking) throw new Error('Booking not found in database!');
  console.log(`   Found Booking: ${foundBooking.bookingCode}`);
  console.log(`   Student: ${foundBooking.student?.name} (${foundBooking.student?.email})`);
  console.log(`   Service: ${foundBooking.service.name} (${foundBooking.service.category?.name})`);
  console.log(`   Provider: ${foundBooking.service.provider?.name}`);
  console.log(`   Amount: ₹${foundBooking.amount}`);
  console.log(`   Payment Method: ${foundBooking.payments[0]?.method}`);
  console.log(`   Payment Status: ${foundBooking.payments[0]?.status}`);
  console.log(`   Payment Gateway Tx: ${foundBooking.payments[0]?.transactionId}`);

  if (foundBooking.payments[0]?.status !== PaymentStatus.SUCCESSFUL) {
    throw new Error('Payment status verification failed!');
  }

  // 5. Test search and filtering
  console.log('5. Testing search by booking ID...');
  const searchResult = await db.booking.findMany({
    where: {
      bookingCode: { contains: bookingCode },
    },
  });
  console.log(`   Search matched: ${searchResult.length} booking (Expected: 1)`);
  if (searchResult.length !== 1) throw new Error('Booking search failed!');

  // 6. Test administrative status update
  console.log('6. Testing administrative status update (PENDING -> CONFIRMED)...');
  const updatedBooking = await db.booking.update({
    where: { id: booking.id },
    data: { status: BookingStatus.CONFIRMED },
  });
  console.log(`   Updated Status: ${updatedBooking.status} (Expected: CONFIRMED)`);
  if (updatedBooking.status !== BookingStatus.CONFIRMED) {
    throw new Error('Failed to update booking status!');
  }

  // 7. Cleanup
  console.log('7. Cleaning up test records...');
  await db.payment.delete({ where: { id: payment.id } });
  await db.booking.delete({ where: { id: booking.id } });
  await db.service.delete({ where: { id: service.id } });
  await db.user.delete({ where: { id: student.id } });
  await db.user.delete({ where: { id: provider.id } });
  console.log('   All test records cleaned up successfully.');

  console.log('\n=== ADMIN BOOKINGS LEDGER VERIFICATION PASSED ===\n');
}

verifyAdminBookings()
  .catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });

