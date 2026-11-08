import 'dotenv/config';
import { db } from '../src/lib/db';
import { Role } from '@prisma/client';

/**
 * Utility script for demo/evaluator to assign any role to a user.
 * Usage:
 *   npx tsx scripts/set-user-role.ts <email-or-clerkId> <STUDENT|SERVICE_PROVIDER|ADMIN>
 */

async function main() {
  const args = process.argv.slice(2);
  const identifier = args[0];
  const targetRole = args[1]?.toUpperCase() as Role;

  if (!identifier || !targetRole || !['STUDENT', 'SERVICE_PROVIDER', 'ADMIN'].includes(targetRole)) {
    console.log('Usage: npx tsx scripts/set-user-role.ts <email-or-clerkId> <STUDENT|SERVICE_PROVIDER|ADMIN>');
    process.exit(1);
  }

  const user = await db.user.findFirst({
    where: {
      OR: [
        { email: identifier },
        { clerkUserId: identifier },
      ],
    },
  });

  if (!user) {
    console.error(`User with identifier "${identifier}" not found in database.`);
    process.exit(1);
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: { role: targetRole },
  });

  console.log(`✅ Success! Updated user ${updated.name || updated.email} (${updated.clerkUserId}) to role "${updated.role}".`);
  await db.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});

