import { db } from '../src/lib/db';
import { BookingStatus, PaymentStatus, Role } from '@prisma/client';

async function verifyAdminAnalytics() {
  console.log('=== VERIFYING ADMIN ANALYTICS & DATABASE-DRIVEN TELEMETRY ===\n');

  // 1. Verify User Demographics & Growth
  console.log('1. Querying Prisma User Demographics & Growth...');
  const [totalUsers, studentUsers, providerUsers, adminUsers] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: Role.STUDENT } }),
    db.user.count({ where: { role: Role.SERVICE_PROVIDER } }),
    db.user.count({ where: { role: Role.ADMIN } }),
  ]);

  console.log(`   Total Users: ${totalUsers}`);
  console.log(`   - Students: ${studentUsers}`);
  console.log(`   - Providers: ${providerUsers}`);
  console.log(`   - Admins: ${adminUsers}`);

  if (totalUsers === 0) {
    throw new Error('User count must be greater than 0.');
  }

  // 2. Verify Bookings Over Time
  console.log('\n2. Querying Bookings Over Time from Prisma...');
  const bookings = await db.booking.findMany({
    select: {
      id: true,
      bookingCode: true,
      amount: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`   Total Bookings Queried: ${bookings.length}`);
  if (bookings.length === 0) {
    throw new Error('Bookings must exist in the database.');
  }

  const earliestBooking = bookings[0];
  const latestBooking = bookings[bookings.length - 1];
  console.log(`   Earliest Booking Date: ${earliestBooking.createdAt.toISOString()}`);
  console.log(`   Latest Booking Date: ${latestBooking.createdAt.toISOString()}`);

  // 3. Verify Revenue Over Time & Successful Payments
  console.log('\n3. Querying Settled Revenue Over Time from Prisma Payments...');
  const successfulPayments = await db.payment.findMany({
    where: { status: PaymentStatus.SUCCESSFUL },
    select: {
      id: true,
      paymentCode: true,
      amount: true,
      paidAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const totalSettledRevenue = successfulPayments.reduce((sum, p) => sum + p.amount, 0);
  console.log(`   Successful Payments: ${successfulPayments.length}`);
  console.log(`   Total Settled Revenue: ₹${totalSettledRevenue.toLocaleString('en-IN')}`);

  if (successfulPayments.length === 0) {
    throw new Error('Successful payments must exist in the database.');
  }

  // 4. Verify Most Popular Services
  console.log('\n4. Querying Most Popular Services with Bookings & Ratings...');
  const popularServices = await db.service.findMany({
    include: {
      category: { select: { name: true } },
      provider: { select: { name: true } },
      bookings: { select: { id: true, status: true, amount: true } },
      reviews: { select: { rating: true } },
    },
  });

  const rankedServices = popularServices
    .map((s) => ({
      name: s.name,
      category: s.category?.name || 'Uncategorized',
      provider: s.provider?.name || 'Institutional Campus',
      bookingCount: s.bookings.length,
      revenue: s.bookings
        .filter((b) => b.status === BookingStatus.COMPLETED)
        .reduce((sum, b) => sum + b.amount, 0),
      avgRating:
        s.reviews.length > 0
          ? (s.reviews.reduce((sum, r) => sum + r.rating, 0) / s.reviews.length).toFixed(1)
          : 'None',
    }))
    .sort((a, b) => b.bookingCount - a.bookingCount);

  console.log(`   Services Analyzed: ${rankedServices.length}`);
  console.log('   Top 3 Popular Services:');
  rankedServices.slice(0, 3).forEach((s, idx) => {
    console.log(
      `     #${idx + 1}: ${s.name} | ${s.category} | ${s.bookingCount} orders | ₹${s.revenue} | ${s.avgRating}★`
    );
  });

  // 5. Verify Most Active Providers
  console.log('\n5. Querying Most Active Providers...');
  const activeProviders = await db.user.findMany({
    where: { role: Role.SERVICE_PROVIDER },
    include: {
      services: {
        include: {
          bookings: { select: { id: true, status: true, amount: true } },
          reviews: { select: { rating: true } },
        },
      },
    },
  });

  const rankedProviders = activeProviders
    .map((p) => {
      let totalB = 0;
      let completedB = 0;
      let revenue = 0;
      p.services.forEach((s) => {
        totalB += s.bookings.length;
        const comp = s.bookings.filter((b) => b.status === BookingStatus.COMPLETED);
        completedB += comp.length;
        revenue += comp.reduce((sum, b) => sum + b.amount, 0);
      });
      return {
        name: p.name,
        email: p.email,
        servicesCount: p.services.length,
        totalBookings: totalB,
        completedBookings: completedB,
        revenue,
      };
    })
    .sort((a, b) => b.totalBookings - a.totalBookings);

  console.log(`   Active Providers Analyzed: ${rankedProviders.length}`);
  rankedProviders.forEach((p, idx) => {
    console.log(
      `     #${idx + 1}: ${p.name} (${p.email}) | ${p.servicesCount} services | ${p.totalBookings} orders | ₹${p.revenue}`
    );
  });

  // 6. Verify Booking Status Distribution
  console.log('\n6. Querying Booking Status Distribution (Prisma groupBy)...');
  const bookingStatusGroups = await db.booking.groupBy({
    by: ['status'],
    _count: { id: true },
  });

  bookingStatusGroups.forEach((g) => {
    console.log(`     Status ${g.status}: ${g._count.id} bookings`);
  });

  // 7. Verify Payment Status Distribution
  console.log('\n7. Querying Payment Status Distribution (Prisma groupBy)...');
  const paymentStatusGroups = await db.payment.groupBy({
    by: ['status'],
    _count: { id: true },
    _sum: { amount: true },
  });

  paymentStatusGroups.forEach((g) => {
    console.log(
      `     Payment Status ${g.status}: ${g._count.id} txs (₹${g._sum.amount ?? 0})`
    );
  });

  // 8. Verify Average Ratings & Feedback Distribution
  console.log('\n8. Querying Reviews & Average Ratings...');
  const reviewAgg = await db.review.aggregate({
    _avg: { rating: true },
    _count: { id: true },
  });

  const ratingGroups = await db.review.groupBy({
    by: ['rating'],
    _count: { id: true },
    orderBy: { rating: 'desc' },
  });

  console.log(`   Total Reviews: ${reviewAgg._count.id}`);
  console.log(`   Campus Average Rating: ${(reviewAgg._avg.rating ?? 0).toFixed(2)} ★`);
  console.log('   Star Breakdown:');
  ratingGroups.forEach((rg) => {
    console.log(`     ${rg.rating} Stars: ${rg._count.id} reviews`);
  });

  console.log('\n=== ALL ADMIN ANALYTICS PRISMA QUERIES VERIFIED SUCCESSFULLY ===');
}

verifyAdminAnalytics()
  .catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });

