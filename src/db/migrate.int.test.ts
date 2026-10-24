import { readFileSync } from 'node:fs';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createScratchDb } from '../test/scratch-db';

const scratchDb = createScratchDb();
const scratch = scratchDb.client;
const db = () => drizzle(scratch);
const tableExists = scratchDb.tableExists;

// drizzle-kit has no down migrations: run the paired SQL, then forget the
// latest applied migration so it can be applied again.
async function rollbackLatest(downFile: string) {
  await scratch.query(readFileSync(`drizzle/down/${downFile}`, 'utf8'));
  await scratch.query(
    'delete from drizzle.__drizzle_migrations where id = (select max(id) from drizzle.__drizzle_migrations)',
  );
}

// Newest first: later migrations may depend on the baseline.
async function rollbackAll() {
  await rollbackLatest('0001_audit_log.down.sql');
  await rollbackLatest('0000_baseline.down.sql');
}

beforeAll(scratchDb.setup);
afterAll(scratchDb.teardown);

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

    await rollbackAll();
    expect(await tableExists('app_meta')).toBe(false);

    await migrate(db(), { migrationsFolder: 'drizzle' });
    expect(await tableExists('app_meta')).toBe(true);
  });
});
