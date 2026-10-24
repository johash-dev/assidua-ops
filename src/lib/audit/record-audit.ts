import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { z } from 'zod';
import { auditLog } from '../../db/schema';
import { auditActionSchema } from './actions';

// Anything with Drizzle's insert(): the db handle or a transaction, so the
// audit row commits or rolls back with the caller's business write.
export type AuditExecutor = Pick<NodePgDatabase, 'insert'>;

// Note text and credentials must never reach the audit log (§3.8). This is a
// guard, not proof: callers stay responsible for what they put in details.
const forbiddenKeys = new Set(['note', 'notes', 'password', 'token', 'secret']);

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

const jsonValue: z.ZodType<Json, unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(jsonValue),
    z
      .custom<Record<string, unknown>>(isPlainObject)
      .pipe(z.record(z.string(), jsonValue)),
  ]),
);

function findForbiddenKey(value: Json): string | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findForbiddenKey(item);
      if (found) return found;
    }
  } else if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (forbiddenKeys.has(key.toLowerCase())) return key;
      const found = findForbiddenKey(child);
      if (found) return found;
    }
  }
  return undefined;
}

const detailsSchema = z
  .record(z.string(), jsonValue)
  .superRefine((details, ctx) => {
    const key = findForbiddenKey(details);
    if (key) {
      ctx.addIssue({
        code: 'custom',
        message: `details must not contain "${key}"`,
      });
    }
  });

const nonBlank = z.string().trim().min(1);

const auditEntrySchema = z.object({
  actorId: nonBlank,
  action: auditActionSchema,
  entityType: nonBlank,
  entityId: nonBlank,
  departmentId: nonBlank.nullish(),
  details: detailsSchema.default({}),
});

export type AuditEntry = z.input<typeof auditEntrySchema>;

export async function recordAudit(
  executor: AuditExecutor,
  entry: AuditEntry,
): Promise<void> {
  const parsed = auditEntrySchema.parse(entry);
  await executor.insert(auditLog).values({
    actorId: parsed.actorId,
    action: parsed.action,
    entityType: parsed.entityType,
    entityId: parsed.entityId,
    departmentId: parsed.departmentId ?? null,
    details: parsed.details,
  });
}
