import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const adminUrl = process.env.DATABASE_URL;
if (!adminUrl) {
  throw new Error(
    'DATABASE_URL is required for integration tests (run via scripts/verify.sh)',
  );
}

const scratchName = `ao_test_${randomBytes(6).toString('hex')}`;
const scratchUrl = new URL(adminUrl);
scratchUrl.pathname = `/${scratchName}`;

const admin = new pg.Client({ connectionString: adminUrl });
const scratch = new pg.Client({ connectionString: scratchUrl.toString() });
const db = () => drizzle(scratch);

async function tableExists(name: string): Promise<boolean> {
  const { rows } = await scratch.query(
    'select to_regclass($1) is not null as present',
    [`public.${name}`],
  );
  return rows[0].present;
}

// drizzle-kit has no down migrations: run the paired SQL, then forget the
// latest applied migration so it can be applied again.
async function rollbackBaseline() {
  await scratch.query(
    readFileSync('drizzle/down/0000_baseline.down.sql', 'utf8'),
  );
  await scratch.query(
    'delete from drizzle.__drizzle_migrations where id = (select max(id) from drizzle.__drizzle_migrations)',
  );
}

beforeAll(async () => {
  await admin.connect();
  await admin.query(`create database ${scratchName}`);
  await scratch.connect();
});

afterAll(async () => {
  await scratch.end();
  await admin.query(`drop database if exists ${scratchName}`);
  await admin.end();
});

describe('database', () => {
  it('connects to PostgreSQL 18', async () => {
    const { rows } = await scratch.query('show server_version_num');
    expect(Number(rows[0].server_version_num)).toBeGreaterThanOrEqual(180000);
  });

  it('fails when the database is unreachable', async () => {
    const bad = new pg.Client({
      connectionString: 'postgres://nobody:nope@127.0.0.1:1/none',
      connectionTimeoutMillis: 2000,
    });
    await expect(bad.connect()).rejects.toThrow();
  });

  it('applies the baseline migration, rolls it back and re-applies it', async () => {
    await migrate(db(), { migrationsFolder: 'drizzle' });
    expect(await tableExists('app_meta')).toBe(true);

    await rollbackBaseline();
    expect(await tableExists('app_meta')).toBe(false);

    await migrate(db(), { migrationsFolder: 'drizzle' });
    expect(await tableExists('app_meta')).toBe(true);
  });
});
