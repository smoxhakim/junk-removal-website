import 'dotenv/config';
import { afterAll, describe, expect, it } from 'vitest';

// Verifies the app can reach its Postgres database (Neon in production) through
// the Prisma driver adapter. Skipped when no DATABASE_URL is configured.
describe.skipIf(!process.env.DATABASE_URL)('database connection', () => {
  afterAll(async () => {
    const { prisma } = await import('@/lib/prisma');
    await prisma.$disconnect();
  });

  it('runs a query through Prisma', async () => {
    const { prisma } = await import('@/lib/prisma');
    const rows = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1::int AS ok`;
    expect(rows).toEqual([{ ok: 1 }]);
  });
});
