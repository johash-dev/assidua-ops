import { describe, expect, it } from 'vitest';
import { parseEnv } from './env';

describe('parseEnv', () => {
  it('defaults to development with the fake SMS and local storage providers', () => {
    const env = parseEnv({});
    expect(env).toMatchObject({
      APP_ENV: 'development',
      SMS_PROVIDER: 'fake',
      STORAGE_PROVIDER: 'local',
    });
  });

  it('keeps fake and local providers under test', () => {
    expect(parseEnv({ APP_ENV: 'test' }).SMS_PROVIDER).toBe('fake');
  });

  it.each(['staging', 'production'])(
    'allows real provider ids in %s',
    (APP_ENV) => {
      const env = parseEnv({
        APP_ENV,
        SMS_PROVIDER: 'twilio',
        STORAGE_PROVIDER: 's3',
      });
      expect(env.SMS_PROVIDER).toBe('twilio');
      expect(env.STORAGE_PROVIDER).toBe('s3');
    },
  );

  it.each(['development', 'test'])(
    'rejects a real SMS provider in %s',
    (APP_ENV) => {
      expect(() => parseEnv({ APP_ENV, SMS_PROVIDER: 'twilio' })).toThrow(
        /SMS_PROVIDER/,
      );
    },
  );

  it.each(['development', 'test'])(
    'rejects a real storage provider in %s',
    (APP_ENV) => {
      expect(() => parseEnv({ APP_ENV, STORAGE_PROVIDER: 's3' })).toThrow(
        /STORAGE_PROVIDER/,
      );
    },
  );

  it('rejects an unknown APP_ENV', () => {
    expect(() => parseEnv({ APP_ENV: 'prod' })).toThrow(/APP_ENV/);
  });
});
