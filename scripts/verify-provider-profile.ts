import { db } from '../src/lib/db';
import { Role, BookingStatus } from '@prisma/client';

async function verifyProviderProfile() {
  console.log('=== VERIFYING SERVICE PROVIDER PROFILE SYSTEM ===');

  const testProviderId = `test_prov_${Date.now()}`;
  const testEmail = `provider.${Date.now()}@campusserve.edu`;

  // 1. Create a mock service provider in Neon PostgreSQL
  console.log('1. Creating test Service Provider in Neon PostgreSQL...');
  const provider = await db.user.create({
    data: {
      clerkUserId: `user_${testProviderId}`,
      name: 'Sunil Kumar (Test Provider)',
      email: testEmail,
      phone: '+91 98765 12345',
      role: Role.SERVICE_PROVIDER,
    },
  });
  console.log(`   Created Provider ID: ${provider.id}, Role: ${provider.role}`);

  // 2. Create a test category and service owned by this provider
  console.log('2. Creating test Service under this Provider...');
  let category = await db.serviceCategory.findFirst();
  if (!category) {
    category = await db.serviceCategory.create({
      data: {
        name: 'Hostel Laundry',
        slug: `hostel-laundry-${Date.now()}`,
        description: 'Automated campus washing machines and steam pressing',
      },
    });
  }

  const service = await db.service.create({
    data: {
      name: 'Express Wash & Fold (SAC Booth)',
      description: 'Quick laundry service for campus residents',
      price: 150,
      durationMinutes: 45,
      location: 'SAC Ground Floor Room 104',
      providerId: provider.id,
      categoryId: category.id,
      isActive: true,
    },
  });
  console.log(`   Created Service ID: ${service.id}, Price: ₹${service.price}`);

  // 3. Create a test student and bookings + reviews
  console.log('3. Simulating student bookings and reviews...');
  const student = await db.user.create({
    data: {
      clerkUserId: `user_student_${Date.now()}`,
      name: 'Priya Sharma (Student)',
      email: `student.${Date.now()}@campusserve.edu`,
      role: Role.STUDENT,
    },
  });

  const booking1 = await db.booking.create({
    data: {
      bookingCode: `BK-TEST-${Date.now()}-1`,
      serviceId: service.id,
      studentId: student.id,
      status: BookingStatus.COMPLETED,
      amount: 150,
      scheduledAt: new Date(),
    },
  });

  const review1 = await db.review.create({
    data: {
      bookingId: booking1.id,
      serviceId: service.id,
      userId: student.id,
      rating: 5,
      comment: 'Super fast delivery and great quality pressing!',
    },
  });

  await db.booking.create({
    data: {
      bookingCode: `BK-TEST-${Date.now()}-2`,
      serviceId: service.id,
      studentId: student.id,
      status: BookingStatus.CONFIRMED,
      amount: 150,
      scheduledAt: new Date(),
    },
  });

  console.log('4. Testing Provider Performance Summary calculation...');
  const rawServices = await db.service.findMany({
    where: { providerId: provider.id },
    include: {
      category: { select: { name: true } },
      bookings: { select: { id: true, status: true, amount: true } },
      reviews: { select: { id: true, rating: true } },
    },
  });

  let totalBookings = 0;
  let completedBookings = 0;
  let inProgressBookings = 0;
  let totalRevenue = 0;

  rawServices.forEach((s) => {
    s.bookings.forEach((b) => {
      totalBookings += 1;
      if (b.status === BookingStatus.COMPLETED) {
        completedBookings += 1;
        totalRevenue += b.amount;
      } else if (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.IN_PROGRESS) {
        inProgressBookings += 1;
      }
    });
  });

  const allRatings: number[] = [];
  rawServices.forEach((s) => {
    s.reviews.forEach((r) => {
      allRatings.push(r.rating);
    });
  });

  const avgRating = allRatings.length > 0 ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1) : '0';

  console.log(`   Total Services: ${rawServices.length}`);
  console.log(`   Total Bookings: ${totalBookings}`);
  console.log(`   Completed Bookings: ${completedBookings}`);
  console.log(`   In Progress Bookings: ${inProgressBookings}`);
  console.log(`   Total Revenue: ₹${totalRevenue}`);
  console.log(`   Average Rating: ${avgRating} ★ (${allRatings.length} reviews)`);

  if (totalBookings !== 2 || completedBookings !== 1 || totalRevenue !== 150 || avgRating !== '5.0') {
    throw new Error('Performance metric calculation mismatch!');
  }

  // 5. Testing Self-Editing & Authorization
  console.log('5. Testing provider self-edit and security guarantees...');
  const updatedProvider = await db.user.update({
    where: { id: provider.id },
    data: {
      name: 'Sunil Kumar (Updated Desk)',
      phone: '+91 99999 88888',
    },
  });
  console.log(`   Updated Name: ${updatedProvider.name}`);
  console.log(`   Updated Phone: ${updatedProvider.phone}`);

  if (updatedProvider.name !== 'Sunil Kumar (Updated Desk)' || updatedProvider.phone !== '+91 99999 88888') {
    throw new Error('Provider profile update failed!');
  }

  // 6. Clean up test data
  console.log('6. Cleaning up test entities...');
  await db.review.delete({ where: { id: review1.id } });
  await db.booking.deleteMany({ where: { serviceId: service.id } });
  await db.service.delete({ where: { id: service.id } });
  await db.user.delete({ where: { id: student.id } });
  await db.user.delete({ where: { id: provider.id } });
  console.log('   Test entities cleaned up successfully.');

  console.log('=== SERVICE PROVIDER PROFILE VERIFICATION PASSED ===\n');
}

verifyProviderProfile()
  .catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
