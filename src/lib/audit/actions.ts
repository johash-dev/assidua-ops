import { z } from 'zod';

// Audit events from approved scope §3.8. Plain text in the database, so later
// stories add ids here without a migration.
export const auditActions = [
  'inquiry.created',
  'job.created',
  'job.status_changed',
  'job.technician_assigned',
  'job.technician_reassigned',
  'job.deadline_changed',
  'department.default_deadline_applied',
  'job.closed',
  'job.cancelled',
  'job.reopened',
  'job.reclassified',
  'customer.created',
  'customer.updated',
  'customer.deleted',
  'site.created',
  'site.updated',
  'site.deleted',
  'technician.created',
  'technician.updated',
  'technician.deleted',
  'user.created',
  'user.updated',
  'user.role_changed',
] as const;

export const auditActionSchema = z.enum(auditActions);
export type AuditAction = z.infer<typeof auditActionSchema>;
