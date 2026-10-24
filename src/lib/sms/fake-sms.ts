import type { SmsMessage, SmsSender } from './port';

/** Zero-cost sender for development and tests: keeps messages in memory. */
export class FakeSmsSender implements SmsSender {
  readonly outbox: SmsMessage[] = [];

  async send(message: SmsMessage): Promise<void> {
    this.outbox.push({ ...message });
  }
}
