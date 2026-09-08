export interface MessagingProvider {
  sendOtp(phone: string, code: string): Promise<void>;
  healthCheck(): Promise<boolean>;
  normalizePhone(phone: string): string;
}
