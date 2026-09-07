import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteShell } from "@/components/site-shell";
import { Badge } from "@/design-system/kindred-library-51411a";
import { formatPrice, resolveImage } from "@/data/catalog";
import { listProducts } from "@/lib/catalog.functions";

export const Route = createFileRoute("/bolsas/")({
  loader: async () => ({ products: await listProducts() }),
  head: () => ({
    meta: [
      { title: "Bolsas de crochê feitas à mão — Adribacci" },
      {
        name: "description",
        content:
          "Bolsas artesanais de crochê do ateliê Adribacci: pronta-entrega e peças sob encomenda, em algodão, fio de malha e ráfia natural.",
      },
      { property: "og:title", content: "Bolsas de crochê feitas à mão — Adribacci" },
      {
        property: "og:description",
        content: "Peças em algodão, fio de malha e ráfia natural, feitas uma a uma no ateliê.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: () => (
    <SiteShell>
      <p className="mx-auto max-w-2xl px-5 py-24 text-body-lg text-on-surface-variant">
        Não conseguimos carregar as bolsas agora. Atualize a página em instantes.
      </p>
    </SiteShell>
  ),
  notFoundComponent: () => (
    <SiteShell>
      <p className="mx-auto max-w-2xl px-5 py-24 text-body-lg text-on-surface-variant">
        Página não encontrada.
      </p>
    </SiteShell>
  ),
  component: ProductsPage,
});

function ProductsPage() {
  const { products } = Route.useLoaderData();
  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-5 py-14">
        <p className="text-overline text-accent-leather">Loja</p>
        <h1 className="mt-3 text-display">Bolsas feitas uma a uma</h1>
        <p className="mt-5 max-w-2xl text-body-lg text-on-surface-variant">
          Peças de pronta-entrega saem do ateliê já prontas. As de encomenda são iniciadas depois
          do pedido, no prazo indicado em cada bolsa.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Link
              key={product.id}
              to="/bolsas/$slug"
              params={{ slug: product.slug }}
              className="group overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest"
            >
              <div className="relative aspect-3/4 overflow-hidden">
                <img
                  src={resolveImage(product.imageKey)}
                  alt={product.imageAlt}
                  loading="lazy"
                  width={900}
                  height={1200}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <Badge
                  variant={product.availability === "encomenda" ? "leather" : "success"}
                  className="absolute top-3 left-3"
                >
                  {product.availability === "encomenda" ? "Encomenda" : "Pronta-entrega"}
                </Badge>
              </div>
              <div className="flex flex-col gap-2 p-5">
                <h2 className="text-title">{product.name}</h2>
                <p className="text-body-sm text-on-surface-variant">
                  {product.shortDescription}
                </p>
                <span className="mt-2 text-price text-primary">
                  {formatPrice(product.priceCents)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </SiteShell>
  );
}
