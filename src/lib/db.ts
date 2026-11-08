import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Production-ready PrismaClient singleton pattern
 * Prevents multiple instances of Prisma Client in development during Next.js hot reloads.
 * Strictly configured with @prisma/adapter-pg for Neon PostgreSQL serverless pooling.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function initPrismaClient(): PrismaClient {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/campusserve?schema=public';

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error'],
  });
}

if (
  globalForPrisma.prisma &&
  !(globalForPrisma.prisma as unknown as { serviceCategory?: unknown }).serviceCategory
) {
  globalForPrisma.prisma = undefined;
}

export const db = globalForPrisma.prisma ?? initPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

/**
 * Diagnostic database verification function
 * Executes a light query against Neon PostgreSQL to verify connectivity
 */
export async function verifyDatabaseConnection(): Promise<{
  connected: boolean;
  database?: string;
  version?: string;
  error?: string;
  latencyMs?: number;
}> {
  const startTime = Date.now();
  try {
    const result = await db.$queryRaw<
      Array<{ connected: number; current_database: string; version: string }>
    >`SELECT 1 as connected, current_database(), version()`;

    const latencyMs = Date.now() - startTime;
    const row = result[0];

    return {
      connected: true,
      database: row?.current_database,
      version: row?.version,
      latencyMs,
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : 'Unknown connection error';
    return {
      connected: false,
      error: errorMessage,
      latencyMs,
    };
  }
}

export default db;
