import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LeadSource, LeadStatus, Prisma } from '@/generated/prisma/client';

// No database needed: checks the generated client and the committed migration.

const CORE_TABLES = ['BusinessProfile', 'LeadPhoto', 'QuoteRequest', 'Service', 'ServiceArea'];
const migrationsDir = join(process.cwd(), 'prisma', 'migrations');
const migrationDirs = readdirSync(migrationsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

describe('core schema v1', () => {
  it('generates a client with exactly the five Phase 1 models', () => {
    expect(Object.values(Prisma.ModelName).sort()).toEqual(CORE_TABLES);
  });

  it('defines the documented lead enums', () => {
    expect(Object.values(LeadStatus)).toEqual(['new', 'contacted', 'quoted', 'booked', 'lost']);
    expect(Object.values(LeadSource)).toEqual([
      'organic',
      'gbp',
      'ads',
      'direct',
      'referral',
      'direct_mail',
    ]);
  });

  describe('first migration', () => {
    const first = migrationDirs[0];
    const sql = readFileSync(join(migrationsDir, first, 'migration.sql'), 'utf8');

    it('is the core_schema_v1 migration', () => {
      expect(first).toMatch(/^\d{14}_core_schema_v1$/);
    });

    it('creates only the five core tables and the two lead enums', () => {
      const tables = [...sql.matchAll(/CREATE TABLE "(\w+)"/g)].map((m) => m[1]).sort();
      const enums = [...sql.matchAll(/CREATE TYPE "(\w+)" AS ENUM/g)].map((m) => m[1]).sort();
      expect(tables).toEqual(CORE_TABLES);
      expect(enums).toEqual(['LeadSource', 'LeadStatus']);
    });

    it('makes array columns NOT NULL so ZIP matching can never see a NULL list', () => {
      for (const column of ['guarantees', 'paymentMethodsAccepted', 'zipCodes']) {
        expect(sql).toMatch(new RegExp(`"${column}" TEXT\\[\\] NOT NULL DEFAULT`));
      }
    });

    it('keeps leads when a service or town is deleted, and removes photos with their lead', () => {
      expect(sql).toMatch(/QuoteRequest_serviceId_fkey.*ON DELETE SET NULL/);
      expect(sql).toMatch(/QuoteRequest_locationId_fkey.*ON DELETE SET NULL/);
      expect(sql).toMatch(/LeadPhoto_leadId_fkey.*ON DELETE CASCADE/);
    });
  });
});
