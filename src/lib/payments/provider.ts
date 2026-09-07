// Interface interna de pagamento (RF-PAG-001). Hoje só existe a implementação
// simulada; o Mercado Pago entra depois como outra implementação desta mesma
// interface, sem mexer nas rotas de carrinho/pedido.

export type PaymentOutcome = "aprovado" | "recusado";

export interface PaymentIntent {
  provider: string;
  externalId: string;
  status: "pendente" | "pago" | "recusado";
  raw: Record<string, unknown>;
}

export interface PaymentProvider {
  name: string;
  /** Cria a cobrança do pedido no provedor. */
  createPayment(input: { orderId: string; amountCents: number }): Promise<PaymentIntent>;
  /** Resolve a cobrança. No mock, o resultado é escolhido na tela de teste. */
  resolvePayment(input: {
    orderId: string;
    amountCents: number;
    outcome: PaymentOutcome;
  }): Promise<PaymentIntent>;
}

export const mockPaymentProvider: PaymentProvider = {
  name: "mock",
  async createPayment({ orderId, amountCents }) {
    return {
      provider: "mock",
      externalId: `mock_${orderId}`,
      status: "pendente",
      raw: { simulado: true, amountCents, criadoEm: new Date().toISOString() },
    };
  },
  async resolvePayment({ orderId, amountCents, outcome }) {
    return {
      provider: "mock",
      externalId: `mock_${orderId}`,
      status: outcome === "aprovado" ? "pago" : "recusado",
      raw: {
        simulado: true,
        amountCents,
        resultado: outcome,
        resolvidoEm: new Date().toISOString(),
      },
    };
  },
};

export function getPaymentProvider(): PaymentProvider {
  return mockPaymentProvider;
}
