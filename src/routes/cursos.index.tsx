import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { SiteShell } from "@/components/site-shell";
import { Badge, Button } from "@/design-system/kindred-library-51411a";
import {
  formatDuration,
  formatPrice,
  resolveImage,
  totalLessons,
  totalMinutes,
  type CourseLevel,
} from "@/data/catalog";
import { listCourses } from "@/lib/catalog.functions";

export const Route = createFileRoute("/cursos/")({
  loader: async () => ({ courses: await listCourses() }),
  head: () => ({
    meta: [
      { title: "Cursos de crochê em vídeo — Adribacci" },
      {
        name: "description",
        content:
          "Cursos de crochê da Adribacci: bolsa bucket, tote com alças de couro e clutch em ponto fechado, com aulas em vídeo e gráficos em PDF.",
      },
      { property: "og:title", content: "Cursos de crochê em vídeo — Adribacci" },
      {
        property: "og:description",
        content: "Bolsa bucket, tote com alças de couro e clutch em ponto fechado, passo a passo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: () => (
    <SiteShell>
      <p className="mx-auto max-w-2xl px-5 py-24 text-body-lg text-on-surface-variant">
        Não conseguimos carregar os cursos agora. Atualize a página em instantes.
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
  component: CoursesPage,
});

const levels: (CourseLevel | "Todos")[] = ["Todos", "Iniciante", "Intermediário", "Avançado"];

function CoursesPage() {
  const { courses } = Route.useLoaderData();
  const [level, setLevel] = useState<CourseLevel | "Todos">("Todos");
  const list = level === "Todos" ? courses : courses.filter((c) => c.level === level);

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-5 py-14">
        <p className="text-overline text-accent-leather">Cursos</p>
        <h1 className="mt-3 text-display">Aulas em vídeo, ponto por ponto</h1>
        <p className="mt-5 max-w-2xl text-body-lg text-on-surface-variant">
          Cada curso tem módulos curtos, câmera sobre as mãos e gráfico em PDF para imprimir. O
          acesso fica liberado pelo período indicado em cada página.
        </p>

        <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filtrar por nível">
          {levels.map((option) => (
            <Button
              key={option}
              variant={level === option ? "primary" : "outline-neutral"}
              size="pill"
              onClick={() => setLevel(option)}
              aria-pressed={level === option}
            >
              {option}
            </Button>
          ))}
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((course) => (
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
                <h2 className="text-title">{course.title}</h2>
                <p className="text-body-sm text-on-surface-variant">{course.shortDescription}</p>
                <p className="text-body-sm text-on-surface-variant">
                  {totalLessons(course)} aulas · {formatDuration(totalMinutes(course))} · acesso
                  por {course.accessDurationDays} dias
                </p>
                <span className="mt-2 text-price text-primary">
                  {formatPrice(course.priceCents)}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {list.length === 0 && (
          <p className="mt-10 text-body-lg text-on-surface-variant">
            Nenhum curso neste nível por enquanto.
          </p>
        )}
      </div>
    </SiteShell>
  );
}
