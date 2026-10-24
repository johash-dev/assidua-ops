import { describe, expect, it, vi } from 'vitest';
import { auditActions } from './actions';
import { recordAudit, type AuditExecutor } from './record-audit';

function fakeExecutor() {
  const values = vi.fn().mockResolvedValue(undefined);
  const insert = vi.fn().mockReturnValue({ values });
  return { executor: { insert } as unknown as AuditExecutor, insert, values };
}

const valid = {
  actorId: 'user-1',
  action: 'job.status_changed',
  entityType: 'job',
  entityId: 'job-42',
} as const;

describe('recordAudit validation', () => {
  it.each([
    ['missing actor', { ...valid, actorId: undefined }],
    ['empty actor', { ...valid, actorId: '' }],
    ['blank actor', { ...valid, actorId: '   ' }],
    ['unknown action', { ...valid, action: 'job.exploded' }],
    ['missing action', { ...valid, action: undefined }],
    ['missing entityType', { ...valid, entityType: undefined }],
    ['missing entityId', { ...valid, entityId: undefined }],
    ['empty entityId', { ...valid, entityId: '' }],
    ['denylisted key', { ...valid, details: { note: 'free text' } }],
    ['denylisted key, any case', { ...valid, details: { Password: 'x' } }],
    ['nested denylisted key', { ...valid, details: { a: { token: 'x' } } }],
    [
      'denylisted key inside an array',
      { ...valid, details: { a: [{ secret: 'x' }] } },
    ],
    ['non-JSON value (function)', { ...valid, details: { a: () => 1 } }],
    ['non-JSON value (undefined)', { ...valid, details: { a: undefined } }],
    ['non-JSON value (Date)', { ...valid, details: { a: new Date() } }],
    ['non-object details', { ...valid, details: 'text' }],
  ])('rejects %s and inserts nothing', async (_name, input) => {
    const { executor, insert } = fakeExecutor();
    await expect(recordAudit(executor, input as never)).rejects.toThrow();
    expect(insert).not.toHaveBeenCalled();
  });

  it('accepts every declared action', () => {
    expect(auditActions.length).toBeGreaterThan(0);
    expect(new Set(auditActions).size).toBe(auditActions.length);
  });
});

describe('recordAudit insert', () => {
  it('inserts the actor, action, entity and an empty details object', async () => {
    const { executor, insert, values } = fakeExecutor();
    await recordAudit(executor, valid);
    expect(insert).toHaveBeenCalledTimes(1);
    expect(values).toHaveBeenCalledWith({
      actorId: 'user-1',
      action: 'job.status_changed',
      entityType: 'job',
      entityId: 'job-42',
      departmentId: null,
      details: {},
    });
  });

  it('passes departmentId and JSON details through', async () => {
    const { executor, values } = fakeExecutor();
    await recordAudit(executor, {
      ...valid,
      departmentId: 'dept-7',
      details: { from: 'open', to: 'in_progress', count: 2, flags: [true] },
    });
    expect(values).toHaveBeenCalledWith({
      actorId: 'user-1',
      action: 'job.status_changed',
      entityType: 'job',
      entityId: 'job-42',
      departmentId: 'dept-7',
      details: { from: 'open', to: 'in_progress', count: 2, flags: [true] },
    });
  });
});
