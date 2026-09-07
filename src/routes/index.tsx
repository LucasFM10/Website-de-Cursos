import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { SiteShell } from "@/components/site-shell";
import { Badge, Button } from "@/design-system/kindred-library-51411a";
import {
  formatDuration,
  formatPrice,
  images,
  resolveImage,
  totalLessons,
  totalMinutes,
} from "@/data/catalog";
import { listCourses, listProducts } from "@/lib/catalog.functions";

export const Route = createFileRoute("/")({
  loader: async () => ({
    courses: await listCourses(),
    products: await listProducts(),
  }),
  head: () => ({
    meta: [
      { title: "Adribacci — Cursos de crochê e bolsas feitas à mão" },
      {
        name: "description",
        content:
          "Aprenda crochê com aulas em vídeo passo a passo e leve para casa bolsas artesanais feitas uma a uma no ateliê Adribacci.",
      },
      { property: "og:title", content: "Adribacci — Cursos de crochê e bolsas feitas à mão" },
      {
        property: "og:description",
        content:
          "Aulas em vídeo passo a passo e bolsas artesanais feitas uma a uma no ateliê Adribacci.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: () => (
    <SiteShell>
      <p className="mx-auto max-w-2xl px-5 py-24 text-body-lg text-on-surface-variant">
        Não conseguimos carregar o catálogo agora. Atualize a página em instantes.
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
  component: Home,
});

function Home() {
  const { courses, products } = Route.useLoaderData();
  const featuredCourses = courses.filter((c) => c.featured).slice(0, 3);
  const featuredProducts = products.filter((p) => p.featured).slice(0, 3);

  return (
    <SiteShell>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <p className="text-overline text-accent-leather">Ateliê de crochê · feito à mão</p>
          <h1 className="mt-4 text-display text-on-surface">
            O fio na mão, o tempo devagar, a bolsa pronta.
          </h1>
          <p className="mt-6 max-w-lg text-body-lg text-on-surface-variant">
            Cursos em vídeo que ensinam cada ponto sem pressa, e bolsas artesanais feitas uma a
            uma aqui no ateliê. Escolha aprender, escolha levar — ou os dois.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/cursos">
              <Button size="pill">Ver os cursos</Button>
            </Link>
            <Link to="/bolsas">
              <Button size="pill" variant="outline">
                Conhecer as bolsas
              </Button>
            </Link>
          </div>
        </div>
        <img
          src={images.heroAtelier}
          alt="Mãos crochetando uma bolsa em fio terracota sobre mesa de linho"
          width={1600}
          height={1100}
          className="w-full rounded-2xl border border-outline-variant object-cover"
        />
      </section>

      <section className="mx-auto max-w-6xl px-5 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-overline text-accent-leather">Cursos</p>
            <h2 className="mt-2 text-headline-lg">Aprenda no seu ritmo</h2>
          </div>
          <Link
            to="/cursos"
            className="inline-flex items-center gap-1 text-label text-primary hover:text-primary-container"
          >
            Ver todos os cursos <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredCourses.map((course) => (
            <Link
              key={course.id}
              to="/cursos/$slug"
              params={{ slug: course.slug }}
              className="group overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest"
            >
              <div className="relative aspect-3/4 overflow-hidden">
                <img
                  src={resolveImage(course.imageKey)}
                  alt={course.imageAlt}
                  loading="lazy"
                  width={900}
                  height={1200}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <Badge variant="level" className="absolute top-3 left-3">
                  {course.level}
                </Badge>
              </div>
              <div className="flex flex-col gap-2 p-5">
                <h3 className="text-title">{course.title}</h3>
                <p className="text-body-sm text-on-surface-variant">{course.shortDescription}</p>
                <p className="text-body-sm text-on-surface-variant">
                  {totalLessons(course)} aulas · {formatDuration(totalMinutes(course))}
                </p>
                <span className="mt-2 text-price text-primary">
                  {formatPrice(course.priceCents)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-overline text-accent-leather">Loja</p>
            <h2 className="mt-2 text-headline-lg">Bolsas prontas para levar</h2>
          </div>
          <Link
            to="/bolsas"
            className="inline-flex items-center gap-1 text-label text-primary hover:text-primary-container"
          >
            Ver a loja <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((product) => (
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
              </div>
              <div className="flex flex-col gap-2 p-5">
                <h3 className="text-title">{product.name}</h3>
                <p className="text-body-sm text-on-surface-variant">
                  {product.shortDescription}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-price text-primary">
                    {formatPrice(product.priceCents)}
                  </span>
                  <Badge variant={product.availability === "encomenda" ? "leather" : "success"}>
                    {product.availability === "encomenda" ? "Encomenda" : "Pronta-entrega"}
                  </Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-6xl px-5">
        <div className="grid items-center gap-10 rounded-2xl border border-outline-variant bg-surface-container-low p-8 lg:grid-cols-3 lg:p-12">
          <img
            src={images.artesaRetrato}
            alt="Retrato da artesã no ateliê, cercada de fios de algodão e bolsas prontas"
            loading="lazy"
            width={1200}
            height={1200}
            className="w-full rounded-2xl object-cover"
          />
          <div className="lg:col-span-2">
            <p className="text-overline text-accent-leather">A artesã</p>
            <h2 className="mt-2 text-headline-lg">Cada peça sai destas mãos</h2>
            <p className="mt-4 text-body-lg text-on-surface-variant">
              O ateliê Adribacci nasceu de uma caixa de fios e da vontade de ensinar. Hoje são
              cursos gravados com a câmera sobre as mãos, para você ver o ponto exatamente como
              ele acontece, e bolsas feitas com calma, sem produção em série.
            </p>
            <Link to="/sobre" className="mt-6 inline-block">
              <Button variant="outline">Conhecer a história</Button>
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
