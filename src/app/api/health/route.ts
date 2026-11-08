import { NextResponse } from 'next/server';
import { isRazorpayConfigured } from '@/lib/razorpay';
import { verifyDatabaseConnection } from '@/lib/db';
import { APP_CONFIG } from '@/lib/constants';

export async function GET() {
  const isDatabaseConfigured = Boolean(process.env.DATABASE_URL);
  const isClerkConfigured = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
  );

  const dbConnection = isDatabaseConfigured
    ? await verifyDatabaseConnection()
    : { connected: false, error: 'DATABASE_URL not configured' };

  const healthData = {
    service: APP_CONFIG.name,
    version: APP_CONFIG.version,
    status: dbConnection.connected ? 'healthy' : 'database_unreachable',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    stack: {
      framework: 'Next.js 16 (App Router)',
      language: 'TypeScript',
      styling: 'Tailwind CSS v4 + shadcn/ui',
      authentication: {
        provider: 'Clerk',
        status: isClerkConfigured ? 'configured' : 'mock_placeholder',
      },
      database: {
        provider: 'Neon PostgreSQL (Prisma ORM)',
        status: dbConnection.connected ? 'connected' : 'connection_error',
        details: dbConnection.connected
          ? {
              database: dbConnection.database,
              latencyMs: dbConnection.latencyMs,
            }
          : {
              error: dbConnection.error,
              latencyMs: dbConnection.latencyMs,
            },
      },
      payments: {
        provider: 'Razorpay Test Mode',
        status: isRazorpayConfigured ? 'configured' : 'mock_test_mode',
      },
    },
    systemChecks: {
      uptime: process.uptime(),
      nodeVersion: process.version,
    },
  };

  return NextResponse.json(healthData, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
