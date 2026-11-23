import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

// Serverless-safe singleton: reuse one client (and one pg pool) across
// hot-reloads in dev and across invocations within a warm Vercel function.
//
// Runtime queries use DATABASE_URL — on Neon this should be the POOLED
// connection string (host contains "-pooler"). Migrations use the direct URL
// (see prisma.config.ts).

export function createPrismaClient(connectionString = process.env.DATABASE_URL): PrismaClient {
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env and add your Neon (pooled) connection string.',
    );
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
