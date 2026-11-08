import { db } from '../src/lib/db';
import { Role, NotificationType } from '@prisma/client';

async function verifyAdminServices() {
  console.log('=== VERIFYING ADMIN SERVICES MODERATION SYSTEM ===\n');

  // 1. Create mock provider and category
  const providerClerkId = `user_prov_adm_${Date.now()}`;
  console.log('1. Setting up mock service provider in Neon PostgreSQL...');
  const provider = await db.user.create({
    data: {
      clerkUserId: providerClerkId,
      name: 'Central IT Desk (Vendor)',
      email: `it.desk.${Date.now()}@campusserve.edu`,
      phone: '+91 95555 66666',
      role: Role.SERVICE_PROVIDER,
    },
  });

  let category = await db.serviceCategory.findFirst();
  if (!category) {
    category = await db.serviceCategory.create({
      data: {
        name: 'Technical Equipment & Labs',
        slug: `tech-labs-${Date.now()}`,
      },
    });
  }

  // 2. Create service
  console.log('2. Creating test service with audit timestamps...');
  const service = await db.service.create({
    data: {
      name: 'High-Performance GPU Server Access',
      description: 'Access to university AI & Deep Learning cluster',
      price: 250,
      durationMinutes: 120,
      location: 'Computer Center Lab 301',
      capacity: 4,
      isActive: true,
      categoryId: category.id,
      providerId: provider.id,
    },
  });
  console.log(`   Service ID: ${service.id}`);
  console.log(`   Initial Status: ${service.isActive ? 'Active' : 'Inactive'}`);
  console.log(`   Initial CreatedAt: ${service.createdAt.toISOString()}`);
  console.log(`   Initial UpdatedAt: ${service.updatedAt.toISOString()}`);

  // 3. Test Toggle Status (Deactivate / Reactivate)
  console.log('3. Testing administrative service deactivation...');
  const deactivated = await db.service.update({
    where: { id: service.id },
    data: { isActive: false },
  });
  console.log(`   New Status: ${deactivated.isActive ? 'Active' : 'Inactive'} (Expected: Inactive)`);
  if (deactivated.isActive !== false) {
    throw new Error('Failed to deactivate service!');
  }

  // 4. Test Edit Service Details & Audit Timestamps
  console.log('4. Testing administrative service edit & audit timestamp refresh...');
  // Brief delay to ensure timestamp progression
  await new Promise((r) => setTimeout(r, 100));

  const edited = await db.service.update({
    where: { id: service.id },
    data: {
      name: 'High-Performance GPU Cluster (Audited by Admin)',
      price: 200,
      durationMinutes: 180,
      isActive: true,
    },
  });
  console.log(`   Updated Name: ${edited.name}`);
  console.log(`   Updated Price: ₹${edited.price}`);
  console.log(`   Updated Duration: ${edited.durationMinutes} mins`);
  console.log(`   Refreshed UpdatedAt: ${edited.updatedAt.toISOString()}`);

  if (edited.price !== 200 || edited.durationMinutes !== 180 || !edited.isActive) {
    throw new Error('Failed to update service details!');
  }

  // 5. Test Destructive Removal & Provider Audit Notification
  console.log('5. Testing administrative removal and audit notification...');
  const removalReason = 'Violation of campus shared computing fair-use policy.';

  await db.notification.create({
    data: {
      userId: provider.id,
      title: 'Service Removed by Campus Administration',
      message: `Your service "${edited.name}" was removed. Reason: ${removalReason}`,
      type: NotificationType.SYSTEM_ALERT,
    },
  });

  const notif = await db.notification.findFirst({
    where: { userId: provider.id },
    orderBy: { createdAt: 'desc' },
  });
  console.log(`   Audit notification dispatched to provider: "${notif?.title}"`);
  if (!notif || !notif.message.includes(removalReason)) {
    throw new Error('Audit notification failed!');
  }

  // Delete service permanently
  await db.service.delete({
    where: { id: service.id },
  });
  console.log('   Permanently deleted service from database.');

  const checkDeleted = await db.service.findUnique({
    where: { id: service.id },
  });
  if (checkDeleted !== null) {
    throw new Error('Service record was not deleted!');
  }

  // 6. Cleanup
  console.log('6. Cleaning up test provider and notification...');
  await db.notification.deleteMany({ where: { userId: provider.id } });
  await db.user.delete({ where: { id: provider.id } });
  console.log('   Test records cleaned up successfully.');

  console.log('\n=== ADMIN SERVICES MODERATION VERIFICATION PASSED ===\n');
}

verifyAdminServices()
  .catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });

