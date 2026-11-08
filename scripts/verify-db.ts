import 'dotenv/config';
import { verifyDatabaseConnection, db } from '../src/lib/db';

async function main() {
  console.log('\n======================================================');
  console.log('CampusServe — Database Infrastructure Connectivity Check');
  console.log('======================================================\n');

  const rawUrl = process.env.DATABASE_URL;

  if (!rawUrl) {
    console.error('❌ Error: DATABASE_URL environment variable is missing.');
    console.error('Please configure DATABASE_URL in your .env file.\n');
    process.exit(1);
  }

  // Parse connection metadata without leaking credentials
  try {
    const url = new URL(rawUrl);
    const isNeon = url.hostname.includes('neon.tech');
    const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

    console.log(`📡 Target Host: ${url.hostname}`);
    console.log(`🔌 Target Port: ${url.port || '5432'}`);
    console.log(`🗄️  Database Name: ${url.pathname.replace(/^\//, '')}`);
    console.log(`☁️  Provider Type: ${isNeon ? 'Neon PostgreSQL (Serverless)' : isLocal ? 'Local PostgreSQL' : 'PostgreSQL Cloud'}`);
    console.log(`🔐 SSL Mode: ${url.searchParams.get('sslmode') || 'default'}`);
    console.log(`⚡ Connection Pooler: ${url.hostname.includes('pooler') ? 'Enabled (Port 6543/pgbouncer)' : 'Direct Connection'}`);
    console.log('------------------------------------------------------');
  } catch {
    console.log('⚠️  DATABASE_URL format is non-standard, proceeding with connection attempt...');
  }

  console.log('\nTesting connection with Prisma ORM...');
  const result = await verifyDatabaseConnection();

  if (result.connected) {
    console.log('\n✅ Successfully connected to PostgreSQL database!');
    console.log(`⏱️  Latency: ${result.latencyMs}ms`);
    console.log(`📦 Database: ${result.database}`);
    console.log(`📜 Server Engine: ${result.version?.split(' on ')[0] || result.version}`);
    console.log('\nDatabase infrastructure is verified and ready for migration.\n');
    await db.$disconnect();
    process.exit(0);
  } else {
    console.log('\n❌ Database connection attempt failed:');
    console.log(`⚠️  Reason: ${result.error}`);
    console.log(`⏱️  Latency: ${result.latencyMs}ms`);
    console.log('\nDiagnostic Advice:');
    console.log('1. Verify your DATABASE_URL in .env matches your Neon Console connection string.');
    console.log('2. Ensure ?sslmode=require is included in your Neon connection string.');
    console.log('3. Ensure your IP or Neon compute endpoint is active.\n');
    await db.$disconnect();
    process.exit(1);
  }
}

main().catch(async (e) => {
  console.error('Fatal execution error:', e);
  await db.$disconnect();
  process.exit(1);
});
