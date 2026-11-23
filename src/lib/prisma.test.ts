import { afterEach, describe, expect, it, vi } from 'vitest';

describe('prisma client', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('fails fast with a clear message when DATABASE_URL is missing', async () => {
    vi.stubEnv('DATABASE_URL', '');
    await expect(import('./prisma')).rejects.toThrow(/DATABASE_URL is not set/);
  });

  it('constructs without connecting when DATABASE_URL is set', async () => {
    // Unreachable host on purpose: construction must be lazy (no network I/O),
    // so importing the module during `next build` is safe.
    vi.stubEnv('DATABASE_URL', 'postgresql://user:pass@127.0.0.1:1/none');
    const { prisma } = await import('./prisma');
    expect(prisma).toBeDefined();
    expect(typeof prisma.$queryRaw).toBe('function');
  });
});
