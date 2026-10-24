export interface SmsMessage {
  to: string;
  body: string;
}

export interface SmsSender {
  send(message: SmsMessage): Promise<void>;
}
