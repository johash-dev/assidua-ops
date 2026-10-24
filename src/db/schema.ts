import { bigint, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

// Baseline table so the migration pipeline is exercised. Timestamps are UTC.
export const appMeta = pgTable('app_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Append-only (BR-12): triggers in drizzle/0001_audit_log.sql reject UPDATE,
// DELETE and TRUNCATE. actor_id and department_id have no FKs yet because the
// users and departments tables arrive with later stories.
export const auditLog = pgTable('audit_log', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  occurredAt: timestamp('occurred_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  actorId: text('actor_id').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  departmentId: text('department_id'),
  details: jsonb('details').notNull().default({}),
});
