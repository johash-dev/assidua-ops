import { describe, expect, it } from 'vitest';
import { BUSINESS_TIME_ZONE, toColomboDate } from './time';

describe('toColomboDate', () => {
  it('uses the Asia/Colombo business time zone', () => {
    expect(BUSINESS_TIME_ZONE).toBe('Asia/Colombo');
  });

  it('rolls to the next Colombo day at 18:30 UTC', () => {
    expect(toColomboDate(new Date('2026-10-24T18:30:00Z'))).toBe('2026-10-25');
  });

  it('stays on the same Colombo day at 18:29 UTC', () => {
    expect(toColomboDate(new Date('2026-10-24T18:29:59Z'))).toBe('2026-10-24');
  });

  it('rolls over the year boundary', () => {
    expect(toColomboDate(new Date('2026-12-31T18:30:00Z'))).toBe('2027-01-01');
  });

  it('rejects an invalid date', () => {
    expect(() => toColomboDate(new Date('not a date'))).toThrow(RangeError);
  });
});
