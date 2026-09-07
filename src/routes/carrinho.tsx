import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";

import { SiteShell } from "@/components/site-shell";
import { Button, Card, Divider } from "@/design-system/kindred-library-51411a";
import { formatPrice, resolveImage } from "@/data/catalog";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: "Carrinho — Adribacci" },
      {
        name: "description",
        content: "Revise os cursos de crochê e as bolsas escolhidas antes de finalizar o pedido.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Carrinho — Adribacci" },
      { property: "og:description", content: "Cursos e bolsas escolhidas no ateliê Adribacci." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, subtotalCents, hydrated, setQuantity, remove, requiresShipping } = useCart();

  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl px-5 py-14">
        <p className="text-overline text-accent-leather">Seu pedido</p>
        <h1 className="mt-3 text-display">Carrinho</h1>

        {!hydrated && (
          <p className="mt-10 text-body-md text-on-surface-variant">Carregando…</p>
        )}

        {hydrated && items.length === 0 && (
          <Card className="mt-10 p-8">
            <h2 className="text-headline-sm">Seu carrinho está vazio</h2>
            <p className="mt-3 text-body-md text-on-surface-variant">
              Escolha um curso de crochê ou uma bolsa feita à mão para começar.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/cursos">
                <Button>Ver cursos</Button>
              </Link>
              <Link to="/bolsas">
                <Button variant="outline">Ver bolsas</Button>
              </Link>
            </div>
          </Card>
        )}

        {hydrated && items.length > 0 && (
          <>
            <ul className="mt-10 space-y-4">
              {items.map((item) => (
                <li key={`${item.kind}-${item.id}`}>
                  <Card className="flex flex-wrap items-center gap-5 p-4">
                    <img
                      src={resolveImage(item.imageKey)}
                      alt=""
                      width={160}
                      height={160}
                      className="size-20 rounded-xl object-cover"
                    />
                    <div className="min-w-40 flex-1">
                      <p className="text-overline text-on-surface-variant">
                        {item.kind === "curso" ? "Curso online" : "Bolsa artesanal"}
                      </p>
                      <p className="mt-1 text-headline-sm">{item.title}</p>
                      <p className="mt-1 text-body-sm text-on-surface-variant">
                        {formatPrice(item.priceCents)} cada
                      </p>
                    </div>

                    {item.kind === "bolsa" ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline-neutral"
                          size="sm"
                          aria-label="Diminuir quantidade"
                          onClick={() => setQuantity(item.kind, item.id, item.quantity - 1)}
                        >
                          <Minus className="size-4" aria-hidden />
                        </Button>
                        <span className="min-w-8 text-center text-body-lg">{item.quantity}</span>
                        <Button
                          variant="outline-neutral"
                          size="sm"
                          aria-label="Aumentar quantidade"
                          onClick={() => setQuantity(item.kind, item.id, item.quantity + 1)}
                        >
                          <Plus className="size-4" aria-hidden />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-body-sm text-on-surface-variant">
                        Acesso individual
                      </span>
                    )}

                    <p className="min-w-24 text-right text-price text-primary">
                      {formatPrice(item.priceCents * item.quantity)}
                    </p>

                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Remover ${item.title}`}
                      onClick={() => remove(item.kind, item.id)}
                    >
                      <Trash2 className="size-4" aria-hidden />
                      Remover
                    </Button>
                  </Card>
                </li>
              ))}
            </ul>

            <Card className="mt-10 p-6">
              <div className="flex items-center justify-between text-body-lg">
                <span>Subtotal</span>
                <span>{formatPrice(subtotalCents)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-body-md text-on-surface-variant">
                <span>Frete</span>
                <span>{requiresShipping ? "combinado após a confirmação" : "não se aplica"}</span>
              </div>
              <Divider className="my-5" />
              <div className="flex items-center justify-between">
                <span className="text-headline-sm">Total</span>
                <span className="text-price text-primary">{formatPrice(subtotalCents)}</span>
              </div>
              <Link to="/checkout" className="mt-6 block">
                <Button fullWidth>Finalizar pedido</Button>
              </Link>
              <p className="mt-4 text-body-sm text-on-surface-variant">
                O pagamento está em modo de teste: nenhuma cobrança real é feita nesta versão.
              </p>
            </Card>
          </>
        )}
      </div>
    </SiteShell>
  );
}
