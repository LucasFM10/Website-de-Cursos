import type { MessagingProvider } from "./messaging-provider.ts";

export class EvolutionWhatsAppProvider implements MessagingProvider {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly instanceName: string;

  constructor() {
    const apiUrl = Deno.env.get("EVOLUTION_API_URL");
    const apiKey = Deno.env.get("EVOLUTION_API_KEY");
    const instanceName = Deno.env.get("EVOLUTION_INSTANCE_NAME");

    if (!apiUrl || !apiKey || !instanceName) {
      throw new Error("Evolution environment variables are not configured");
    }

    this.apiUrl = apiUrl.replace(/\/+$/, "");
    this.apiKey = apiKey;
    this.instanceName = instanceName;
  }

  normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) {
      throw new Error("Invalid phone number");
    }
    return digits;
  }

  async healthCheck(): Promise<boolean> {
    const response = await fetch(
      `${this.apiUrl}/instance/connectionState/${encodeURIComponent(this.instanceName)}`,
      {
        method: "GET",
        headers: { apikey: this.apiKey },
        signal: AbortSignal.timeout(5000),
      },
    );

    return response.ok;
  }

  async sendOtp(phone: string, code: string): Promise<void> {
    const number = this.normalizePhone(phone);
    const text = [
      `Seu codigo de confirmacao Adribacci e: ${code}`,
      "",
      "Ele expira em poucos minutos. Se voce nao solicitou este codigo, ignore esta mensagem.",
    ].join("\n");

    const response = await fetch(
      `${this.apiUrl}/message/sendText/${encodeURIComponent(this.instanceName)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: this.apiKey,
        },
        body: JSON.stringify({
          number,
          textMessage: { text },
          delay: 800,
          linkPreview: false,
        }),
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!response.ok) {
      throw new Error(`Evolution send failed with status ${response.status}`);
    }
  }
}
