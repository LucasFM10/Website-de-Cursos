import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Ruler, Scissors, ShoppingBag, Truck } from "lucide-react";

import { SiteShell } from "@/components/site-shell";
import { Badge, Button, Divider } from "@/design-system/kindred-library-51411a";
import { formatPrice, resolveImage } from "@/data/catalog";
import { getProductBySlug } from "@/lib/catalog.functions";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/bolsas/$slug")({
  loader: async ({ params }) => {
    const product = await getProductBySlug({ data: { slug: params.slug } });
    if (!product) throw notFound();
    return { product };
  },
  errorComponent: () => (
    <SiteShell>
      <p className="mx-auto max-w-2xl px-5 py-24 text-body-lg text-on-surface-variant">
        Não conseguimos carregar esta peça agora. Atualize a página em instantes.
      </p>
    </SiteShell>
  ),
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Bolsa não encontrada — Adribacci" }, { name: "robots", content: "noindex" }],
      };
    }
    const { product } = loaderData;
    const title = `${product.name} — Bolsa de crochê Adribacci`;
    return {
      meta: [
        { title },
        { name: "description", content: product.shortDescription },
        { property: "og:title", content: title },
        { property: "og:description", content: product.shortDescription },
      ],
    };
  },
  notFoundComponent: ProductNotFound,
  component: ProductDetail,
});

function ProductNotFound() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <h1 className="text-headline-lg">Bolsa não encontrada</h1>
        <p className="mt-4 text-body-lg text-on-surface-variant">
          Esse endereço não corresponde a nenhuma peça da loja.
        </p>
        <Link to="/bolsas" className="mt-8 inline-block">
          <Button>Ver a loja</Button>
        </Link>
      </div>
    </SiteShell>
  );
}

function ProductDetail() {
  const { product } = Route.useLoaderData();
  const { add, has } = useCart();
  const encomenda = product.availability === "encomenda";
  const soldOut = !encomenda && product.stock <= 0;
  const inCart = has("bolsa", product.id);

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-5 py-14">
        <nav aria-label="Trilha" className="text-body-sm text-on-surface-variant">
          <Link to="/bolsas" className="hover:text-primary">
            Bolsas
          </Link>
          <span className="mx-2">/</span>
          <span>{product.name}</span>
        </nav>

        <div className="mt-8 grid gap-12 lg:grid-cols-2">
          <img
            src={resolveImage(product.imageKey)}
            alt={product.imageAlt}
            width={900}
            height={1200}
            className="w-full rounded-2xl border border-outline-variant object-cover"
          />

          <div>
            <Badge variant={encomenda ? "leather" : "success"}>
              {encomenda ? "Feita sob encomenda" : "Pronta-entrega"}
            </Badge>
            <h1 className="mt-4 text-display">{product.name}</h1>
            <p className="mt-4 text-price text-primary">{formatPrice(product.priceCents)}</p>
            <p className="mt-5 text-body-lg text-on-surface-variant">{product.description}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="pill"
                disabled={soldOut}
                onClick={() =>
                  add({
                    kind: "bolsa",
                    id: product.id,
                    slug: product.slug,
                    title: product.name,
                    priceCents: product.priceCents,
                    imageKey: product.imageKey,
                  })
                }
              >
                <ShoppingBag className="size-4" aria-hidden />
                {soldOut ? "Esgotada no momento" : "Adicionar ao carrinho"}
              </Button>
              {inCart && (
                <Link to="/carrinho">
                  <Button size="pill" variant="outline">
                    Ir para o carrinho
                  </Button>
                </Link>
              )}
            </div>
            {encomenda && (
              <p className="mt-4 text-body-sm text-on-surface-variant">
                Peça sob encomenda: a produção leva até {product.productionDays} dias após a
                confirmação do pedido.
              </p>
            )}

            <Divider className="my-10" />

            <dl className="space-y-5">
              <div className="flex gap-3">
                <Scissors className="mt-1 size-4 shrink-0 text-accent-leather" aria-hidden />
                <div>
                  <dt className="text-label">Materiais</dt>
                  <dd className="mt-1 text-body-md text-on-surface-variant">
                    {product.materials.join(" · ")}
                  </dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Ruler className="mt-1 size-4 shrink-0 text-accent-leather" aria-hidden />
                <div>
                  <dt className="text-label">Medidas</dt>
                  <dd className="mt-1 text-body-md text-on-surface-variant">
                    {product.dimensions}
                  </dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Truck className="mt-1 size-4 shrink-0 text-accent-leather" aria-hidden />
                <div>
                  <dt className="text-label">Disponibilidade</dt>
                  <dd className="mt-1 text-body-md text-on-surface-variant">
                    {encomenda
                      ? `Produção em até ${product.productionDays} dias após o pedido`
                      : `${product.stock} ${product.stock === 1 ? "peça disponível" : "peças disponíveis"} no ateliê`}
                  </dd>
                </div>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
