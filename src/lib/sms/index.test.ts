import { describe, expect, it } from 'vitest';
import { createSmsSender } from './index';
import { FakeSmsSender } from './fake-sms';

describe('createSmsSender', () => {
  it('returns the fake sender under development and test', () => {
    expect(createSmsSender({ APP_ENV: 'development' })).toBeInstanceOf(
      FakeSmsSender,
    );
    expect(createSmsSender({ APP_ENV: 'test' })).toBeInstanceOf(FakeSmsSender);
  });

  it('cannot build a real provider outside staging and production', () => {
    expect(() =>
      createSmsSender({ APP_ENV: 'test', SMS_PROVIDER: 'twilio' }),
    ).toThrow(/SMS_PROVIDER/);
  });

  it('refuses a real provider in production until one is implemented', () => {
    expect(() =>
      createSmsSender({ APP_ENV: 'production', SMS_PROVIDER: 'twilio' }),
    ).toThrow(/not implemented/);
  });

  it('records sent messages in the outbox', async () => {
    const sms = new FakeSmsSender();
    await sms.send({ to: '+94770000000', body: 'hello' });
    expect(sms.outbox).toEqual([{ to: '+94770000000', body: 'hello' }]);
  });
});
