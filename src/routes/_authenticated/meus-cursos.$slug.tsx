import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Lock, PlayCircle } from "lucide-react";

import { SiteShell } from "@/components/site-shell";
import { Badge, Button, Card } from "@/design-system/kindred-library-51411a";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/data/catalog";

export const Route = createFileRoute("/_authenticated/meus-cursos/$slug")({
  head: () => ({
    meta: [
      { title: "Aulas do curso — Adribacci" },
      { name: "description", content: "Aulas em vídeo do seu curso de crochê na Adribacci." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Aulas do curso — Adribacci" },
      { property: "og:description", content: "Aulas em vídeo do seu curso de crochê." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MyCoursePage,
});

function MyCoursePage() {
  const { slug } = Route.useParams();

  const { data, isPending, error } = useQuery({
    queryKey: ["meu-curso", slug],
    queryFn: async () => {
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .select(
          "id, slug, title, description, access_duration_days, course_modules(id, title, position, lessons(id, title, position, duration_minutes, video_status, free_preview, bunny_video_id))",
        )
        .eq("slug", slug)
        .maybeSingle();
      if (courseError) throw courseError;
      if (!course) return null;

      const { data: access } = await supabase
        .from("course_access")
        .select("expires_at, revoked, starts_at")
        .eq("course_id", course.id)
        .maybeSingle();

      return { course, access };
    },
  });

  if (isPending) {
    return (
      <SiteShell>
        <p className="mx-auto max-w-6xl px-5 py-16 text-body-md text-on-surface-variant">
          Carregando…
        </p>
      </SiteShell>
    );
  }

  if (error || !data?.course) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-2xl px-5 py-24 text-center">
          <h1 className="text-headline-lg">Curso não encontrado</h1>
          <Link to="/minha-conta" className="mt-8 inline-block">
            <Button>Voltar para minha conta</Button>
          </Link>
        </div>
      </SiteShell>
    );
  }

  const { course, access } = data;
  const active =
    Boolean(access) && !access!.revoked && new Date(access!.expires_at).getTime() > Date.now();
  const modules = (course.course_modules ?? [])
    .slice()
    .sort((a, b) => a.position - b.position);

  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl px-5 py-14">
        <nav aria-label="Trilha" className="text-body-sm text-on-surface-variant">
          <Link to="/minha-conta" className="hover:text-primary">
            Minha conta
          </Link>
          <span className="mx-2">/</span>
          <span>{course.title}</span>
        </nav>

        <h1 className="mt-6 text-display">{course.title}</h1>
        <p className="mt-4 text-body-lg text-on-surface-variant">{course.description}</p>

        <div className="mt-6">
          {active ? (
            <Badge variant="leather">Acesso até {formatDate(access!.expires_at)}</Badge>
          ) : (
            <Badge variant="neutral">Sem acesso vigente</Badge>
          )}
        </div>

        {!active && (
          <Card className="mt-6 p-5">
            <p className="text-body-md text-on-surface-variant">
              Seu acesso a este curso não está vigente. Fale com o ateliê pela página de contato
              para liberar novamente.
            </p>
          </Card>
        )}

        <div className="mt-10 space-y-5">
          {modules.map((module, index) => (
            <Card key={module.id} className="p-5">
              <p className="text-overline text-on-surface-variant">Módulo {index + 1}</p>
              <h2 className="mt-1 text-headline-sm">{module.title}</h2>
              <ul className="mt-4 divide-y divide-outline-variant/50">
                {(module.lessons ?? [])
                  .slice()
                  .sort((a, b) => a.position - b.position)
                  .map((lesson) => {
                    const playable = (active || lesson.free_preview) && Boolean(lesson.bunny_video_id);
                    return (
                      <li
                        key={lesson.id}
                        className="flex items-center justify-between gap-4 py-3 text-body-md"
                      >
                        <span className="flex items-center gap-3">
                          {playable ? (
                            <PlayCircle className="size-4 text-accent-leather" aria-hidden />
                          ) : (
                            <Lock className="size-4 text-on-surface-variant" aria-hidden />
                          )}
                          {lesson.title}
                        </span>
                        <span className="flex items-center gap-4">
                          <span className="text-body-sm text-on-surface-variant">
                            {lesson.bunny_video_id ? `${lesson.duration_minutes} min` : "sem vídeo"}
                          </span>
                          {playable && (
                            <Link to="/aula/$lessonId" params={{ lessonId: lesson.id }}>
                              <Button size="sm">Assistir</Button>
                            </Link>
                          )}
                        </span>
                      </li>
                    );
                  })}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </SiteShell>
  );
}
