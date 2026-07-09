import 'dotenv/config';

import { defineConfig } from 'drizzle-kit';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is not set — add it to .env before running drizzle-kit commands');
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './app/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url },
});
