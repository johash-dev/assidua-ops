import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

// Baseline table so the migration pipeline is exercised. Timestamps are UTC.
export const appMeta = pgTable('app_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
