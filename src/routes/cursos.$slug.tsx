import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Check, Clock, FileText, PlayCircle, ShoppingBag } from "lucide-react";

import { SiteShell } from "@/components/site-shell";
import { Badge, Button, Card, Divider } from "@/design-system/kindred-library-51411a";
import {
  formatDuration,
  formatPrice,
  resolveImage,
  totalLessons,
  totalMinutes,
} from "@/data/catalog";
import { getCourseBySlug } from "@/lib/catalog.functions";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/cursos/$slug")({
  loader: async ({ params }) => {
    const course = await getCourseBySlug({ data: { slug: params.slug } });
    if (!course) throw notFound();
    return { course };
  },
  errorComponent: () => (
    <SiteShell>
      <p className="mx-auto max-w-2xl px-5 py-24 text-body-lg text-on-surface-variant">
        Não conseguimos carregar este curso agora. Atualize a página em instantes.
      </p>
    </SiteShell>
  ),
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Curso não encontrado — Adribacci" }, { name: "robots", content: "noindex" }],
      };
    }
    const { course } = loaderData;
    const title = `${course.title} — Curso de crochê Adribacci`;
    return {
      meta: [
        { title },
        { name: "description", content: course.shortDescription },
        { property: "og:title", content: title },
        { property: "og:description", content: course.shortDescription },
      ],
    };
  },
  notFoundComponent: CourseNotFound,
  component: CourseDetail,
});

function CourseNotFound() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <h1 className="text-headline-lg">Curso não encontrado</h1>
        <p className="mt-4 text-body-lg text-on-surface-variant">
          Esse endereço não corresponde a nenhum curso do catálogo.
        </p>
        <Link to="/cursos" className="mt-8 inline-block">
          <Button>Ver todos os cursos</Button>
        </Link>
      </div>
    </SiteShell>
  );
}

function CourseDetail() {
  const { course } = Route.useLoaderData();
  const { add, has } = useCart();
  const inCart = has("curso", course.id);

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-5 py-14">
        <nav aria-label="Trilha" className="text-body-sm text-on-surface-variant">
          <Link to="/cursos" className="hover:text-primary">
            Cursos
          </Link>
          <span className="mx-2">/</span>
          <span>{course.title}</span>
        </nav>

        <div className="mt-8 grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Badge variant="leather">{course.level}</Badge>
            <h1 className="mt-4 text-display">{course.title}</h1>
            <p className="mt-5 text-body-lg text-on-surface-variant">{course.description}</p>

            <div className="mt-8 flex flex-wrap gap-6 text-body-md text-on-surface-variant">
              <span className="inline-flex items-center gap-2">
                <PlayCircle className="size-4 text-accent-leather" aria-hidden />
                {totalLessons(course)} aulas
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock className="size-4 text-accent-leather" aria-hidden />
                {formatDuration(totalMinutes(course))} de vídeo
              </span>
              <span className="inline-flex items-center gap-2">
                <FileText className="size-4 text-accent-leather" aria-hidden />
                {course.materials.length} materiais para baixar
              </span>
            </div>

            <Divider className="my-10" />

            <h2 className="text-headline-md">O que você vai aprender</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {course.learningOutcomes.map((item) => (
                <li key={item} className="flex gap-3 text-body-md text-on-surface-variant">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>

            <Divider className="my-10" />

            <h2 className="text-headline-md">Conteúdo do curso</h2>
            <div className="mt-6 space-y-5">
              {course.modules.map((module, index) => (
                <Card key={module.id} className="p-5">
                  <p className="text-overline text-on-surface-variant">Módulo {index + 1}</p>
                  <h3 className="mt-1 text-headline-sm">{module.title}</h3>
                  <ul className="mt-4 divide-y divide-outline-variant/50">
                    {module.lessons.map((lesson) => (
                      <li
                        key={lesson.id}
                        className="flex items-center justify-between gap-4 py-3 text-body-md"
                      >
                        <span className="flex items-center gap-3">
                          <PlayCircle className="size-4 text-accent-leather" aria-hidden />
                          {lesson.title}
                        </span>
                        <span className="text-body-sm text-on-surface-variant">
                          {lesson.durationMinutes} min
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>

            <Divider className="my-10" />

            <h2 className="text-headline-md">Materiais inclusos</h2>
            <ul className="mt-4 space-y-2">
              {course.materials.map((material) => (
                <li key={material} className="flex gap-3 text-body-md text-on-surface-variant">
                  <FileText className="mt-0.5 size-4 shrink-0 text-accent-leather" aria-hidden />
                  {material}
                </li>
              ))}
            </ul>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <img
              src={resolveImage(course.imageKey)}
              alt={course.imageAlt}
              width={900}
              height={1200}
              className="w-full rounded-2xl border border-outline-variant object-cover"
            />
            <div className="mt-6 rounded-2xl border border-outline-variant bg-surface-container-lowest p-6">
              <p className="text-price text-primary">{formatPrice(course.priceCents)}</p>
              <p className="mt-2 text-body-md text-on-surface-variant">
                Acesso liberado por {course.accessDurationDays} dias após a compra.
              </p>
              <Button
                fullWidth
                className="mt-6"
                onClick={() =>
                  add({
                    kind: "curso",
                    id: course.id,
                    slug: course.slug,
                    title: course.title,
                    priceCents: course.priceCents,
                    imageKey: course.imageKey,
                  })
                }
              >
                <ShoppingBag className="size-4" aria-hidden />
                {inCart ? "Já está no carrinho" : "Adicionar ao carrinho"}
              </Button>
              {inCart && (
                <Link to="/carrinho" className="mt-3 block">
                  <Button variant="outline" fullWidth>
                    Ir para o carrinho
                  </Button>
                </Link>
              )}
              <Link to="/contato" className="mt-3 block">
                <Button variant="ghost" fullWidth>
                  Tirar uma dúvida
                </Button>
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}
