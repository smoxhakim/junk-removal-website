import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';

// Exercises core schema v1 against a real Postgres: defaults, relations,
// unique constraints and delete rules.
//
// These tests WRITE rows (and clean them up). To make sure they can never touch
// a shared or production database by accident, they only run when DATABASE_URL
// points at a local host, or when ALLOW_DB_WRITE_TESTS=true is set explicitly.

function canWriteToDatabase(): boolean {
  const url = process.env.DATABASE_URL;
  if (!url) return false;
  if (process.env.ALLOW_DB_WRITE_TESTS === 'true') return true;
  try {
    return ['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const run = `t2-${randomUUID().slice(0, 8)}`;

async function db() {
  return (await import('@/lib/prisma')).prisma;
}

function serviceData(suffix: string) {
  return {
    slug: `${run}-service-${suffix}`,
    name: 'Test service',
    shortDescription: 'Short',
    longDescription: 'Long',
    processSteps: [{ title: 'Step 1', body: 'Body' }],
  };
}

function areaData(suffix: string, zipCodes: string[] = []) {
  return { slug: `${run}-area-${suffix}`, name: 'Test town', state: 'MA', zipCodes };
}

describe.skipIf(!canWriteToDatabase())('core schema v1 (database)', () => {
  afterAll(async () => {
    const prisma = await db();
    // Photos cascade with their leads.
    await prisma.quoteRequest.deleteMany({ where: { name: { startsWith: run } } });
    await prisma.service.deleteMany({ where: { slug: { startsWith: run } } });
    await prisma.serviceArea.deleteMany({ where: { slug: { startsWith: run } } });
    await prisma.businessProfile.deleteMany({ where: { name: { startsWith: run } } });
    await prisma.$disconnect();
  });

  it('has the five core tables with their foreign keys', async () => {
    const prisma = await db();
    const tables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`;
    const names = tables.map((t) => t.table_name);
    for (const table of ['BusinessProfile', 'Service', 'ServiceArea', 'QuoteRequest', 'LeadPhoto']) {
      expect(names).toContain(table);
    }

    const fks = await prisma.$queryRaw<{ conname: string; def: string }[]>`
      SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint
      WHERE contype = 'f' AND connamespace = 'public'::regnamespace
      ORDER BY conname`;
    // arrayContaining: later phases add more foreign keys.
    expect(fks).toEqual(expect.arrayContaining([
      {
        conname: 'LeadPhoto_leadId_fkey',
        def: expect.stringMatching(/REFERENCES "QuoteRequest"\(id\).*ON DELETE CASCADE/),
      },
      {
        conname: 'QuoteRequest_locationId_fkey',
        def: expect.stringMatching(/REFERENCES "ServiceArea"\(id\).*ON DELETE SET NULL/),
      },
      {
        conname: 'QuoteRequest_serviceId_fkey',
        def: expect.stringMatching(/REFERENCES "Service"\(id\).*ON DELETE SET NULL/),
      },
    ]));
  });

  it('applies database defaults', async () => {
    const prisma = await db();
    const service = await prisma.service.create({ data: serviceData('defaults') });
    const area = await prisma.serviceArea.create({ data: areaData('defaults') });
    const lead = await prisma.quoteRequest.create({
      data: { name: `${run} lead`, phone: '617-555-0100', zip: '02139' },
    });
    const profile = await prisma.businessProfile.create({
      data: {
        name: `${run} business`,
        phone: '617-555-0100',
        email: 'placeholder@example.com',
        address: 'Placeholder',
        city: 'Boston',
        state: 'MA',
        zip: '02108',
        hours: {},
      },
    });

    expect(service.id).toMatch(UUID_RE);
    expect(service.isActive).toBe(true);
    expect(area.isActive).toBe(false);
    expect(area.zipCodes).toEqual([]);
    expect(lead.status).toBe('new');
    expect(lead.source).toBe('direct');
    expect(lead.createdAt).toBeInstanceOf(Date);
    expect(profile.guarantees).toEqual([]);
    expect(profile.yearsInBusiness).toBeNull();
  });

  it('links a lead to its service, town and photos', async () => {
    const prisma = await db();
    const service = await prisma.service.create({ data: serviceData('relations') });
    const area = await prisma.serviceArea.create({ data: areaData('relations', ['02139']) });
    const lead = await prisma.quoteRequest.create({
      data: {
        name: `${run} lead`,
        phone: '617-555-0101',
        zip: '02139',
        serviceId: service.id,
        locationId: area.id,
        estimatedPriceMin: '150.00',
        estimatedPriceMax: '300.50',
        photos: { create: [{ url: 'https://example.com/a.jpg', storageKey: `${run}/a.jpg` }] },
      },
      include: { service: true, location: true, photos: true },
    });

    expect(lead.service?.slug).toBe(service.slug);
    expect(lead.location?.slug).toBe(area.slug);
    expect(lead.photos).toHaveLength(1);
    expect(lead.estimatedPriceMax?.toString()).toBe('300.5');
  });

  it('finds the town that serves a ZIP code', async () => {
    const prisma = await db();
    const zip = `9${Math.floor(Math.random() * 10_000).toString().padStart(4, '0')}`;
    const area = await prisma.serviceArea.create({ data: areaData('zip', [zip, '02140']) });

    const match = await prisma.serviceArea.findFirst({
      where: { zipCodes: { has: zip }, slug: { startsWith: run } },
    });
    expect(match?.id).toBe(area.id);
  });

  it('rejects duplicate slugs and storage keys', async () => {
    const prisma = await db();
    await prisma.service.create({ data: serviceData('dupe') });
    await expect(prisma.service.create({ data: serviceData('dupe') })).rejects.toMatchObject({
      code: 'P2002',
    });

    const lead = await prisma.quoteRequest.create({
      data: { name: `${run} lead`, phone: '617-555-0102', zip: '02139' },
    });
    const photo = { leadId: lead.id, url: 'https://example.com/b.jpg', storageKey: `${run}/b.jpg` };
    await prisma.leadPhoto.create({ data: photo });
    await expect(prisma.leadPhoto.create({ data: photo })).rejects.toMatchObject({ code: 'P2002' });
  });

  it('rejects a photo for a lead that does not exist', async () => {
    const prisma = await db();
    await expect(
      prisma.leadPhoto.create({
        data: { leadId: randomUUID(), url: 'https://example.com/c.jpg', storageKey: `${run}/c.jpg` },
      }),
    ).rejects.toMatchObject({ code: 'P2003' });
  });

  it('keeps leads when their service or town is deleted', async () => {
    const prisma = await db();
    const service = await prisma.service.create({ data: serviceData('delete') });
    const area = await prisma.serviceArea.create({ data: areaData('delete') });
    const lead = await prisma.quoteRequest.create({
      data: {
        name: `${run} lead`,
        phone: '617-555-0103',
        zip: '02139',
        serviceId: service.id,
        locationId: area.id,
      },
    });

    await prisma.service.delete({ where: { id: service.id } });
    await prisma.serviceArea.delete({ where: { id: area.id } });

    const kept = await prisma.quoteRequest.findUniqueOrThrow({ where: { id: lead.id } });
    expect(kept.serviceId).toBeNull();
    expect(kept.locationId).toBeNull();
  });

  it('deletes photos together with their lead', async () => {
    const prisma = await db();
    const lead = await prisma.quoteRequest.create({
      data: {
        name: `${run} lead`,
        phone: '617-555-0104',
        zip: '02139',
        photos: { create: [{ url: 'https://example.com/d.jpg', storageKey: `${run}/d.jpg` }] },
      },
    });

    await prisma.quoteRequest.delete({ where: { id: lead.id } });
    expect(await prisma.leadPhoto.count({ where: { leadId: lead.id } })).toBe(0);
  });

  it('bumps updatedAt on update', async () => {
    const prisma = await db();
    const lead = await prisma.quoteRequest.create({
      data: { name: `${run} lead`, phone: '617-555-0105', zip: '02139' },
    });
    await new Promise((resolve) => setTimeout(resolve, 10));
    const updated = await prisma.quoteRequest.update({
      where: { id: lead.id },
      data: { status: 'contacted' },
    });
    expect(updated.updatedAt.getTime()).toBeGreaterThan(lead.updatedAt.getTime());
  });
});
