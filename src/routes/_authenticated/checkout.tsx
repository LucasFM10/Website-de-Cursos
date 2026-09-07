import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { SiteShell } from "@/components/site-shell";
import { Button, Card, Divider, Input, Label } from "@/design-system/kindred-library-51411a";
import { formatPrice } from "@/data/catalog";
import { useCart } from "@/lib/cart";
import { createOrder } from "@/lib/orders.functions";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { title: "Finalizar pedido — Adribacci" },
      { name: "description", content: "Confirme seus dados e finalize o pedido no ateliê Adribacci." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Finalizar pedido — Adribacci" },
      { property: "og:description", content: "Confirme seus dados e finalize o pedido." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, subtotalCents, requiresShipping, hydrated, clear } = useCart();
  const { user } = useSession();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const create = useServerFn(createOrder);

  const mutation = useMutation({
    mutationFn: async () =>
      create({
        data: {
          items: items.map((i) => ({ kind: i.kind, id: i.id, quantity: i.quantity })),
          customerName: name,
          customerPhone: phone,
          shippingAddress: address,
          notes,
        },
      }),
    onSuccess: (result) => {
      clear();
      void navigate({ to: "/pedidos/$id", params: { id: result.orderId } });
    },
    onError: (err: Error) => setError(err.message),
  });

  if (hydrated && items.length === 0) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-2xl px-5 py-24">
          <Card className="p-8 text-center">
            <h1 className="text-headline-md">Seu carrinho está vazio</h1>
            <p className="mt-4 text-body-md text-on-surface-variant">
              Adicione um curso ou uma bolsa antes de finalizar.
            </p>
            <Link to="/cursos" className="mt-6 inline-block">
              <Button>Ver cursos</Button>
            </Link>
          </Card>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-5 py-14">
        <p className="text-overline text-accent-leather">Última etapa</p>
        <h1 className="mt-3 text-display">Finalizar pedido</h1>
        <p className="mt-4 text-body-md text-on-surface-variant">
          Pedido no nome de {user?.email}.
        </p>

        <form
          className="mt-10 space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            mutation.mutate();
          }}
        >
          <div>
            <Label htmlFor="nome">Nome completo</Label>
            <Input
              id="nome"
              className="mt-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Como devemos te chamar"
              required
            />
          </div>

          <div>
            <Label htmlFor="telefone">Telefone (WhatsApp)</Label>
            <Input
              id="telefone"
              className="mt-2"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
              required
            />
          </div>

          {requiresShipping && (
            <div>
              <Label htmlFor="endereco">Endereço de entrega</Label>
              <textarea
                id="endereco"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                required
                placeholder="Rua, número, complemento, bairro, cidade, estado e CEP"
                className="mt-2 w-full rounded-lg border border-outline bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              />
              <p className="mt-2 text-body-sm text-on-surface-variant">
                Seu pedido tem bolsa, por isso precisamos do endereço.
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="obs">Observações (opcional)</Label>
            <textarea
              id="obs"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Preferência de cor, prazo desejado…"
              className="mt-2 w-full rounded-lg border border-outline bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            />
          </div>

          <Card className="p-6">
            <h2 className="text-headline-sm">Resumo</h2>
            <ul className="mt-4 space-y-2">
              {items.map((item) => (
                <li
                  key={`${item.kind}-${item.id}`}
                  className="flex items-center justify-between gap-4 text-body-md text-on-surface-variant"
                >
                  <span>
                    {item.title}
                    {item.kind === "bolsa" && item.quantity > 1 ? ` × ${item.quantity}` : ""}
                  </span>
                  <span>{formatPrice(item.priceCents * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between text-body-md text-on-surface-variant">
              <span>Frete</span>
              <span>{requiresShipping ? "combinado após a confirmação" : "não se aplica"}</span>
            </div>
            <Divider className="my-5" />
            <div className="flex items-center justify-between">
              <span className="text-headline-sm">Total</span>
              <span className="text-price text-primary">{formatPrice(subtotalCents)}</span>
            </div>
          </Card>

          {error && (
            <p role="alert" className="rounded-lg bg-surface-container px-4 py-3 text-body-sm text-primary">
              {error}
            </p>
          )}

          <Button type="submit" fullWidth loading={mutation.isPending}>
            Criar pedido
          </Button>
          <p className="text-body-sm text-on-surface-variant">
            Na próxima tela você simula o pagamento. Nesta versão de teste nenhuma cobrança real é
            feita.
          </p>
        </form>
      </div>
    </SiteShell>
  );
}
