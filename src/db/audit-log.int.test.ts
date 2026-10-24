import { readFileSync } from 'node:fs';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { recordAudit } from '../lib/audit/record-audit';
import { createScratchDb } from '../test/scratch-db';

const scratchDb = createScratchDb();
const scratch = scratchDb.client;
const db = () => drizzle(scratch);

const entry = {
  actorId: 'user-1',
  action: 'job.status_changed',
  entityType: 'job',
  entityId: 'job-42',
} as const;

const IMMUTABLE = /audit_log is append-only/;

beforeAll(async () => {
  await scratchDb.setup();
  await migrate(db(), { migrationsFolder: 'drizzle' });
});
afterAll(scratchDb.teardown);

// Trigger-protected: the only way to empty the table between tests is to
// recreate it, so tests use distinct entity ids and count by entity instead.
let seq = 0;
let entityId: string;
beforeEach(() => {
  entityId = `job-${++seq}`;
});

async function countFor(id: string): Promise<number> {
  const { rows } = await scratch.query(
    'select count(*)::int as n from audit_log where entity_id = $1',
    [id],
  );
  return rows[0].n;
}

describe('audit_log recording (AC1)', () => {
  it('commits a row with the actor and a UTC timestamp', async () => {
    const before = Date.now();
    await db().transaction((tx) => recordAudit(tx, { ...entry, entityId }));
    const { rows } = await scratch.query(
      'select * from audit_log where entity_id = $1',
      [entityId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].actor_id).toBe('user-1');
    expect(rows[0].action).toBe('job.status_changed');
    expect(rows[0].department_id).toBeNull();
    expect(rows[0].details).toEqual({});
    const at = (rows[0].occurred_at as Date).getTime();
    expect(Math.abs(at - before)).toBeLessThan(60_000);
    const { rows: tz } = await scratch.query(
      "select data_type from information_schema.columns where table_name = 'audit_log' and column_name = 'occurred_at'",
    );
    expect(tz[0].data_type).toBe('timestamp with time zone');
  });

  it('persists departmentId and details when given', async () => {
    await recordAudit(db(), {
      ...entry,
      entityId,
      departmentId: 'dept-7',
      details: { from: 'open', to: 'closed' },
    });
    const { rows } = await scratch.query(
      'select department_id, details from audit_log where entity_id = $1',
      [entityId],
    );
    expect(rows[0].department_id).toBe('dept-7');
    expect(rows[0].details).toEqual({ from: 'open', to: 'closed' });
  });
});

describe('audit_log is append-only (AC2)', () => {
  beforeEach(async () => {
    await recordAudit(db(), { ...entry, entityId });
  });

  it('rejects UPDATE through SQL and leaves the row unchanged', async () => {
    await expect(
      scratch.query(
        "update audit_log set actor_id = 'x' where entity_id = $1",
        [entityId],
      ),
    ).rejects.toThrow(IMMUTABLE);
    const { rows } = await scratch.query(
      'select actor_id from audit_log where entity_id = $1',
      [entityId],
    );
    expect(rows[0].actor_id).toBe('user-1');
  });

  it('rejects DELETE through SQL and leaves the row in place', async () => {
    await expect(
      scratch.query('delete from audit_log where entity_id = $1', [entityId]),
    ).rejects.toThrow(IMMUTABLE);
    expect(await countFor(entityId)).toBe(1);
  });

  it('rejects UPDATE and DELETE issued through drizzle', async () => {
    const { auditLog } = await import('./schema');
    const { eq } = await import('drizzle-orm');
    await expect(
      db()
        .update(auditLog)
        .set({ actorId: 'x' })
        .where(eq(auditLog.entityId, entityId)),
    ).rejects.toThrow();
    await expect(
      db().delete(auditLog).where(eq(auditLog.entityId, entityId)),
    ).rejects.toThrow();
    expect(await countFor(entityId)).toBe(1);
  });

  it('rejects TRUNCATE', async () => {
    await expect(scratch.query('truncate audit_log')).rejects.toThrow(
      IMMUTABLE,
    );
    expect(await countFor(entityId)).toBe(1);
  });
});

describe('audit_log joins the caller transaction (AC3)', () => {
  it('leaves no row when the transaction rolls back after recordAudit', async () => {
    await expect(
      db().transaction(async (tx) => {
        await recordAudit(tx, { ...entry, entityId });
        throw new Error('business write failed');
      }),
    ).rejects.toThrow('business write failed');
    expect(await countFor(entityId)).toBe(0);
  });
});

describe('audit_log rejects invalid entries (AC4)', () => {
  it('never reaches the database for an unknown action', async () => {
    await expect(
      recordAudit(db(), {
        ...entry,
        entityId,
        action: 'job.exploded' as never,
      }),
    ).rejects.toThrow();
    expect(await countFor(entityId)).toBe(0);
  });

  it('refuses a missing actor at the database level too', async () => {
    await expect(
      scratch.query(
        "insert into audit_log (actor_id, action, entity_type, entity_id) values (null, 'a', 'b', $1)",
        [entityId],
      ),
    ).rejects.toThrow();
    expect(await countFor(entityId)).toBe(0);
  });
});

describe('audit_log rollback', () => {
  it('drops cleanly with the down SQL and re-applies', async () => {
    await scratch.query(
      readFileSync('drizzle/down/0001_audit_log.down.sql', 'utf8'),
    );
    expect(await scratchDb.tableExists('audit_log')).toBe(false);
    const { rows } = await scratch.query(
      "select count(*)::int as n from pg_proc where proname = 'audit_log_immutable'",
    );
    expect(rows[0].n).toBe(0);

    await scratch.query(
      'delete from drizzle.__drizzle_migrations where id = (select max(id) from drizzle.__drizzle_migrations)',
    );
    await migrate(db(), { migrationsFolder: 'drizzle' });
    expect(await scratchDb.tableExists('audit_log')).toBe(true);
  });
});
