import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Prisma CLI config (migrate, studio, generate).
//
// Migrations must use a DIRECT (unpooled) connection. Neon's Vercel integration
// provides DATABASE_URL (pooled) and DATABASE_URL_UNPOOLED (direct); locally both
// can point at the same database, so we fall back to DATABASE_URL.
//
// `prisma generate` does not need a database, so the URL is optional here
// (CI can generate the client without secrets). Migrate commands fail loudly
// if neither variable is set.
const migrationUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  ...(migrationUrl ? { datasource: { url: migrationUrl } } : {}),
});
