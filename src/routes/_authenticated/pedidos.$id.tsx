import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { SiteShell } from "@/components/site-shell";
import { Badge, Button, Card, Divider } from "@/design-system/kindred-library-51411a";
import { formatDate, formatPrice } from "@/data/catalog";
import { getMyOrder, simulatePayment } from "@/lib/orders.functions";

export const Route = createFileRoute("/_authenticated/pedidos/$id")({
  head: () => ({
    meta: [
      { title: "Meu pedido — Adribacci" },
      { name: "description", content: "Acompanhe a situação do seu pedido no ateliê Adribacci." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Meu pedido — Adribacci" },
      { property: "og:description", content: "Acompanhe a situação do seu pedido." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrderPage,
});

export const paymentLabels: Record<string, string> = {
  pendente: "Aguardando pagamento",
  pago: "Pagamento confirmado",
  recusado: "Pagamento recusado",
  cancelado: "Pedido cancelado",
  reembolsado: "Reembolsado",
};

export const fulfillmentLabels: Record<string, string> = {
  aguardando: "Aguardando",
  "em-preparacao": "Em preparação",
  enviado: "Enviado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

function OrderPage() {
  const { id } = Route.useParams();
  const fetchOrder = useServerFn(getMyOrder);
  const pay = useServerFn(simulatePayment);
  const queryClient = useQueryClient();

  const { data: order, isPending } = useQuery({
    queryKey: ["pedido", id],
    queryFn: () => fetchOrder({ data: { orderId: id } }),
  });

  const mutation = useMutation({
    mutationFn: (outcome: "aprovado" | "recusado") => pay({ data: { orderId: id, outcome } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pedido", id] });
      void queryClient.invalidateQueries({ queryKey: ["meus-pedidos"] });
      void queryClient.invalidateQueries({ queryKey: ["meus-acessos"] });
    },
  });

  if (isPending) {
    return (
      <SiteShell>
        <p className="mx-auto max-w-3xl px-5 py-24 text-body-md text-on-surface-variant">
          Carregando pedido…
        </p>
      </SiteShell>
    );
  }

  if (!order) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-2xl px-5 py-24 text-center">
          <h1 className="text-headline-md">Pedido não encontrado</h1>
          <Link to="/minha-conta" className="mt-6 inline-block">
            <Button>Ir para minha conta</Button>
          </Link>
        </div>
      </SiteShell>
    );
  }

  const paid = order.paymentStatus === "pago";
  const pending = order.paymentStatus === "pendente" || order.paymentStatus === "recusado";
  const hasCourses = order.items.some((i) => i.kind === "curso");

  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-5 py-14">
        <p className="text-overline text-accent-leather">
          Pedido de {formatDate(order.createdAt)}
        </p>
        <h1 className="mt-3 text-display">Meu pedido</h1>

        <div className="mt-6 flex flex-wrap gap-3">
          <Badge variant={paid ? "success" : "neutral"}>
            {paymentLabels[order.paymentStatus] ?? order.paymentStatus}
          </Badge>
          {order.requiresShipping && (
            <Badge variant="leather">
              Entrega: {fulfillmentLabels[order.fulfillmentStatus] ?? order.fulfillmentStatus}
            </Badge>
          )}
        </div>

        <Card className="mt-8 p-6">
          <h2 className="text-headline-sm">Itens</h2>
          <ul className="mt-4 space-y-3">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-body-lg">{item.title}</p>
                  <p className="text-body-sm text-on-surface-variant">
                    {item.kind === "curso"
                      ? `Curso · acesso por ${item.accessDurationDays ?? 180} dias`
                      : `Bolsa · ${item.quantity} unidade(s)`}
                  </p>
                </div>
                <span className="text-body-md">
                  {formatPrice(item.unitPriceCents * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <Divider className="my-5" />
          <div className="flex items-center justify-between text-body-md text-on-surface-variant">
            <span>Frete</span>
            <span>
              {order.requiresShipping
                ? order.shippingCents > 0
                  ? formatPrice(order.shippingCents)
                  : "combinado após a confirmação"
                : "não se aplica"}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-headline-sm">Total</span>
            <span className="text-price text-primary">{formatPrice(order.totalCents)}</span>
          </div>
        </Card>

        {order.requiresShipping && (
          <Card className="mt-6 p-6">
            <h2 className="text-headline-sm">Entrega</h2>
            <p className="mt-3 whitespace-pre-line text-body-md text-on-surface-variant">
              {order.shippingAddress}
            </p>
            <p className="mt-3 text-body-sm text-on-surface-variant">
              {order.customerName} · {order.customerPhone}
            </p>
          </Card>
        )}

        {pending && (
          <Card className="mt-6 p-6">
            <h2 className="text-headline-sm">Pagamento de teste</h2>
            <p className="mt-3 text-body-md text-on-surface-variant">
              O pagamento real ainda não está ligado. Use os botões abaixo para simular o
              resultado — nenhuma cobrança é feita.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button loading={mutation.isPending} onClick={() => mutation.mutate("aprovado")}>
                Simular pagamento aprovado
              </Button>
              <Button
                variant="outline-neutral"
                loading={mutation.isPending}
                onClick={() => mutation.mutate("recusado")}
              >
                Simular pagamento recusado
              </Button>
            </div>
            {mutation.isError && (
              <p role="alert" className="mt-4 text-body-sm text-primary">
                {(mutation.error as Error).message}
              </p>
            )}
          </Card>
        )}

        {paid && (
          <Card className="mt-6 p-6">
            <h2 className="text-headline-sm">Tudo certo!</h2>
            <p className="mt-3 text-body-md text-on-surface-variant">
              {hasCourses
                ? "Os cursos deste pedido já estão liberados na sua área de alunas."
                : "Vamos preparar sua bolsa e avisamos pelo telefone informado."}
            </p>
            <Link to="/minha-conta" className="mt-5 inline-block">
              <Button>{hasCourses ? "Ver meus cursos" : "Ir para minha conta"}</Button>
            </Link>
          </Card>
        )}

        <Link to="/minha-conta" className="mt-8 inline-block">
          <Button variant="ghost">Voltar para minha conta</Button>
        </Link>
      </div>
    </SiteShell>
  );
}
