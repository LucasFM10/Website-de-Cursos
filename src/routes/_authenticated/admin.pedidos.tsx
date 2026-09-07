import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AdminGate } from "@/components/admin-gate";
import { Badge, Button, Card, Divider } from "@/design-system/kindred-library-51411a";
import { formatDate, formatPrice } from "@/data/catalog";
import {
  cancelOrder,
  confirmPaymentManually,
  listOrders,
  updateOrderStatus,
} from "@/lib/orders.functions";

export const Route = createFileRoute("/_authenticated/admin/pedidos")({
  head: () => ({
    meta: [
      { title: "Pedidos — Painel Adribacci" },
      { name: "description", content: "Acompanhe e atualize os pedidos do ateliê Adribacci." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Pedidos — Painel Adribacci" },
      { property: "og:description", content: "Pedidos do ateliê Adribacci." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminOrdersPage,
});

const paymentLabels: Record<string, string> = {
  pendente: "Aguardando pagamento",
  pago: "Pago",
  recusado: "Recusado",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
};

const fulfillmentOptions = [
  { value: "aguardando", label: "Aguardando" },
  { value: "em-preparacao", label: "Em preparação" },
  { value: "enviado", label: "Enviado" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
] as const;

function AdminOrdersPage() {
  const fetchOrders = useServerFn(listOrders);
  const setStatus = useServerFn(updateOrderStatus);
  const confirmPayment = useServerFn(confirmPaymentManually);
  const cancel = useServerFn(cancelOrder);
  const queryClient = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isPending, error } = useQuery({
    queryKey: ["admin-pedidos"],
    queryFn: () => fetchOrders(),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-pedidos"] });
  };

  const statusMutation = useMutation({
    mutationFn: (input: { orderId: string; fulfillmentStatus: string }) =>
      setStatus({ data: input }),
    onSuccess: invalidate,
  });

  const payMutation = useMutation({
    mutationFn: (orderId: string) => confirmPayment({ data: { orderId } }),
    onSuccess: invalidate,
  });

  const cancelMutation = useMutation({
    mutationFn: (orderId: string) => cancel({ data: { orderId } }),
    onSuccess: invalidate,
  });

  const busy = statusMutation.isPending || payMutation.isPending || cancelMutation.isPending;
  const mutationError =
    (statusMutation.error as Error | null)?.message ??
    (payMutation.error as Error | null)?.message ??
    (cancelMutation.error as Error | null)?.message;

  return (
    <AdminGate>
      <h1 className="text-display">Pedidos</h1>
      <p className="mt-3 text-body-md text-on-surface-variant">
        Confirme pagamentos, acompanhe entregas e veja os itens de cada pedido.
      </p>

      {isPending && <p className="mt-8 text-body-md text-on-surface-variant">Carregando…</p>}
      {error && (
        <p role="alert" className="mt-8 text-body-md text-primary">
          Não conseguimos carregar os pedidos agora.
        </p>
      )}
      {mutationError && (
        <p role="alert" className="mt-6 text-body-sm text-primary">
          {mutationError}
        </p>
      )}

      {!isPending && (data ?? []).length === 0 && (
        <Card className="mt-8 p-8">
          <h2 className="text-headline-sm">Nenhum pedido ainda</h2>
          <p className="mt-3 text-body-md text-on-surface-variant">
            Quando alguém finalizar uma compra, o pedido aparece aqui.
          </p>
        </Card>
      )}

      <div className="mt-8 space-y-4">
        {(data ?? []).map((order) => {
          const open = openId === order.id;
          return (
            <Card key={order.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-headline-sm">
                    {order.customerName || "Cliente sem nome"}
                  </p>
                  <p className="mt-1 text-body-sm text-on-surface-variant">
                    {order.customerEmail ?? "—"} · {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={order.paymentStatus === "pago" ? "success" : "neutral"}>
                    {paymentLabels[order.paymentStatus] ?? order.paymentStatus}
                  </Badge>
                  <span className="text-price text-primary">{formatPrice(order.totalCents)}</span>
                  <Button
                    variant="outline-neutral"
                    size="sm"
                    onClick={() => setOpenId(open ? null : order.id)}
                  >
                    {open ? "Fechar" : "Detalhes"}
                  </Button>
                </div>
              </div>

              {open && (
                <>
                  <Divider className="my-5" />
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <p className="text-overline text-on-surface-variant">Itens</p>
                      <ul className="mt-3 space-y-2">
                        {order.items.map((item) => (
                          <li key={item.id} className="text-body-md text-on-surface-variant">
                            {item.title}
                            {item.kind === "bolsa" ? ` × ${item.quantity}` : " (curso)"} —{" "}
                            {formatPrice(item.unitPriceCents * item.quantity)}
                          </li>
                        ))}
                      </ul>
                      {order.notes && (
                        <p className="mt-4 text-body-sm text-on-surface-variant">
                          Observações: {order.notes}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-overline text-on-surface-variant">Contato e entrega</p>
                      <p className="mt-3 text-body-md text-on-surface-variant">
                        {order.customerPhone || "sem telefone"}
                      </p>
                      {order.requiresShipping ? (
                        <p className="mt-2 whitespace-pre-line text-body-md text-on-surface-variant">
                          {order.shippingAddress || "endereço não informado"}
                        </p>
                      ) : (
                        <p className="mt-2 text-body-md text-on-surface-variant">
                          Pedido só com cursos (sem entrega física).
                        </p>
                      )}
                    </div>
                  </div>

                  <Divider className="my-5" />

                  <p className="text-overline text-on-surface-variant">Situação da entrega</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {fulfillmentOptions.map((option) => (
                      <Button
                        key={option.value}
                        size="sm"
                        variant={
                          order.fulfillmentStatus === option.value ? "primary" : "outline-neutral"
                        }
                        disabled={busy}
                        onClick={() =>
                          statusMutation.mutate({
                            orderId: order.id,
                            fulfillmentStatus: option.value,
                          })
                        }
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    {order.paymentStatus !== "pago" && order.paymentStatus !== "cancelado" && (
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => payMutation.mutate(order.id)}
                      >
                        Confirmar pagamento
                      </Button>
                    )}
                    {order.paymentStatus !== "cancelado" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => cancelMutation.mutate(order.id)}
                      >
                        Cancelar pedido
                      </Button>
                    )}
                  </div>
                </>
              )}
            </Card>
          );
        })}
      </div>
    </AdminGate>
  );
}
