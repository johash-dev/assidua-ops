import { randomBytes } from 'node:crypto';
import pg from 'pg';

// One throwaway database per test file, created from DATABASE_URL (the admin
// connection) and dropped afterwards. Never touches the admin database itself.
export function createScratchDb() {
  const adminUrl = process.env.DATABASE_URL;
  if (!adminUrl) {
    throw new Error(
      'DATABASE_URL is required for integration tests (run via scripts/verify.sh)',
    );
  }

  const name = `ao_test_${randomBytes(6).toString('hex')}`;
  const url = new URL(adminUrl);
  url.pathname = `/${name}`;

  const admin = new pg.Client({ connectionString: adminUrl });
  const client = new pg.Client({ connectionString: url.toString() });

  return {
    client,
    async setup() {
      await admin.connect();
      await admin.query(`create database ${name}`);
      await client.connect();
    },
    async teardown() {
      await client.end();
      await admin.query(`drop database if exists ${name}`);
      await admin.end();
    },
    async tableExists(table: string): Promise<boolean> {
      const { rows } = await client.query(
        'select to_regclass($1) is not null as present',
        [`public.${table}`],
      );
      return rows[0].present;
    },
  };
}
