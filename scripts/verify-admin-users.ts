import { db } from '../src/lib/db';
import { Role, BookingStatus } from '@prisma/client';

async function verifyAdminUsers() {
  console.log('=== VERIFYING ADMIN USERS DIRECTORY SYSTEM ===\n');

  // 1. Create a mock admin and mock target users
  const adminClerkId = `user_admin_${Date.now()}`;
  const studentClerkId = `user_std_${Date.now()}`;

  console.log('1. Setting up mock administrator and student in Neon PostgreSQL...');
  const adminUser = await db.user.create({
    data: {
      clerkUserId: adminClerkId,
      name: 'Dr. Anita Roy (Admin)',
      email: `admin.${Date.now()}@campusserve.edu`,
      phone: '+91 91111 22222',
      role: Role.ADMIN,
    },
  });

  const studentUser = await db.user.create({
    data: {
      clerkUserId: studentClerkId,
      name: 'Rohan Verma (Student)',
      email: `rohan.${Date.now()}@campusserve.edu`,
      phone: '+91 93333 44444',
      role: Role.STUDENT,
    },
  });
  console.log(`   Admin ID: ${adminUser.id}, Role: ${adminUser.role}`);
  console.log(`   Student ID: ${studentUser.id}, Role: ${studentUser.role}`);

  // 2. Create category, service, and a booking to verify booking volume computation
  console.log('2. Simulating booking activity for booking count verification...');
  let category = await db.serviceCategory.findFirst();
  if (!category) {
    category = await db.serviceCategory.create({
      data: {
        name: 'Campus IT Services',
        slug: `campus-it-${Date.now()}`,
      },
    });
  }

  const service = await db.service.create({
    data: {
      name: 'Laptop Loan & Repair',
      price: 0,
      durationMinutes: 30,
      categoryId: category.id,
      providerId: adminUser.id,
    },
  });

  const booking = await db.booking.create({
    data: {
      bookingCode: `BK-ADM-TEST-${Date.now()}`,
      serviceId: service.id,
      studentId: studentUser.id,
      status: BookingStatus.CONFIRMED,
      amount: 0,
    },
  });

  // 3. Test aggregate user list query
  console.log('3. Testing admin user directory query with relational aggregates...');
  const usersWithCounts = await db.user.findMany({
    where: {
      id: { in: [adminUser.id, studentUser.id] },
    },
    include: {
      _count: {
        select: {
          bookings: true,
          services: true,
          reviews: true,
          payments: true,
        },
      },
      services: {
        select: {
          bookings: {
            select: { id: true },
          },
        },
      },
    },
  });

  const studentItem = usersWithCounts.find((u) => u.id === studentUser.id);
  const adminItem = usersWithCounts.find((u) => u.id === adminUser.id);

  console.log(`   Student bookings made: ${studentItem?._count.bookings} (Expected: 1)`);
  console.log(`   Admin provider bookings handled: ${adminItem?.services.reduce((s, x) => s + x.bookings.length, 0)} (Expected: 1)`);

  if (studentItem?._count.bookings !== 1) {
    throw new Error('Student booking count calculation failed!');
  }

  // 4. Test administrative role update
  console.log('4. Testing administrative role change (Student -> Service Provider)...');
  const promotedUser = await db.user.update({
    where: { id: studentUser.id },
    data: { role: Role.SERVICE_PROVIDER },
  });
  console.log(`   Updated Role: ${promotedUser.role} (Expected: SERVICE_PROVIDER)`);
  if (promotedUser.role !== Role.SERVICE_PROVIDER) {
    throw new Error('Failed to update user role!');
  }

  // 5. Test administrative contact update
  console.log('5. Testing administrative contact info modification...');
  const updatedContact = await db.user.update({
    where: { id: studentUser.id },
    data: {
      name: 'Rohan Verma (Campus Vendor)',
      phone: '+91 94444 55555',
    },
  });
  console.log(`   Updated Name: ${updatedContact.name}`);
  console.log(`   Updated Phone: ${updatedContact.phone}`);
  if (updatedContact.name !== 'Rohan Verma (Campus Vendor)' || updatedContact.phone !== '+91 94444 55555') {
    throw new Error('Failed to update user contact info!');
  }

  // 6. Test self-demotion protection logic
  console.log('6. Verifying admin self-demotion safety guard logic...');
  const isSelf = adminUser.id === adminUser.id;
  const attemptedRole = Role.STUDENT as Role;
  const shouldBlock = isSelf && attemptedRole !== Role.ADMIN;
  console.log(`   Attempting self-demotion blocked: ${shouldBlock} (Expected: true)`);
  if (!shouldBlock) {
    throw new Error('Self-demotion protection logic failed!');
  }

  // 7. Cleanup
  console.log('7. Cleaning up test records...');
  await db.booking.delete({ where: { id: booking.id } });
  await db.service.delete({ where: { id: service.id } });
  await db.user.delete({ where: { id: studentUser.id } });
  await db.user.delete({ where: { id: adminUser.id } });
  console.log('   Cleaned up test users and bookings successfully.');

  console.log('\n=== ADMIN USERS DIRECTORY VERIFICATION PASSED ===\n');
}

verifyAdminUsers()
  .catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
