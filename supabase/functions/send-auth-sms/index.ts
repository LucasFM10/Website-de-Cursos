import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { EvolutionWhatsAppProvider } from "./providers/evolution-provider.ts";

interface SendSmsEvent {
  user?: {
    phone?: string;
  };
  sms?: {
    otp?: string;
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function verifyHookPayload(request: Request, payload: string): SendSmsEvent {
  const rawSecret = Deno.env.get("SEND_SMS_HOOK_SECRET");
  if (!rawSecret) throw new Error("SEND_SMS_HOOK_SECRET is not configured");

  const secrets = rawSecret
    .split("|")
    .map((secret) => secret.trim().replace(/^v1,whsec_/, ""))
    .filter(Boolean);
  const headers = Object.fromEntries(request.headers);

  for (const secret of secrets) {
    try {
      return new Webhook(secret).verify(payload, headers) as SendSmsEvent;
    } catch {
      // Try the next rotation secret.
    }
  }

  throw new Error("Invalid hook signature");
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: { http_code: 405, message: "Method not allowed" } }, 405);
  }

  try {
    const payload = await request.text();
    const event = verifyHookPayload(request, payload);
    const phone = event.user?.phone;
    const otp = event.sms?.otp;

    if (!phone || !otp) {
      return jsonResponse(
        { error: { http_code: 400, message: "Invalid SMS hook payload" } },
        400,
      );
    }

    const provider = new EvolutionWhatsAppProvider();
    await provider.sendOtp(phone, otp);

    return jsonResponse({});
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown send SMS hook error";
    console.error("[send-auth-sms]", message);

    return jsonResponse(
      { error: { http_code: 500, message: "Nao foi possivel enviar o codigo agora." } },
      500,
    );
  }
});
