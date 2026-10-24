import { parseEnv } from '../config/env';
import { FakeSmsSender } from './fake-sms';
import type { SmsSender } from './port';

export type { SmsMessage, SmsSender } from './port';

export function createSmsSender(
  source: Record<string, string | undefined> = process.env,
): SmsSender {
  const env = parseEnv(source);
  if (env.SMS_PROVIDER === 'fake') return new FakeSmsSender();
  throw new Error(`SMS provider '${env.SMS_PROVIDER}' is not implemented yet`);
}
