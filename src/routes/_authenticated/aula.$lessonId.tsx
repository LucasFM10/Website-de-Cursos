import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { SiteShell } from "@/components/site-shell";
import { Button, Card } from "@/design-system/kindred-library-51411a";
import { getLessonPlayback } from "@/lib/bunny.functions";

export const Route = createFileRoute("/_authenticated/aula/$lessonId")({
  head: () => ({
    meta: [
      { title: "Aula em vídeo — Adribacci" },
      { name: "description", content: "Aula em vídeo do seu curso de crochê na Adribacci." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Aula em vídeo — Adribacci" },
      { property: "og:description", content: "Aula em vídeo do seu curso de crochê." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LessonPage,
});

function LessonPage() {
  const { lessonId } = Route.useParams();
  const fetchPlayback = useServerFn(getLessonPlayback);

  const { data, isPending, error } = useQuery({
    queryKey: ["aula", lessonId],
    queryFn: () => fetchPlayback({ data: { lessonId } }),
    // A URL do vídeo é assinada e temporária.
    staleTime: 60 * 1000,
  });

  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl px-5 py-14">
        {isPending && <p className="text-body-md text-on-surface-variant">Carregando aula…</p>}

        {error && (
          <Card className="p-6">
            <h1 className="text-headline-sm">Não foi possível abrir a aula</h1>
            <p className="mt-3 text-body-md text-on-surface-variant">
              {error instanceof Error ? error.message : "Tente novamente em instantes."}
            </p>
            <Link to="/minha-conta" className="mt-6 inline-block">
              <Button>Voltar para minha conta</Button>
            </Link>
          </Card>
        )}

        {data && (
          <>
            <nav aria-label="Trilha" className="text-body-sm text-on-surface-variant">
              <Link to="/minha-conta" className="hover:text-primary">
                Minha conta
              </Link>
              <span className="mx-2">/</span>
              <Link
                to="/meus-cursos/$slug"
                params={{ slug: data.course.slug }}
                className="hover:text-primary"
              >
                {data.course.title}
              </Link>
            </nav>

            <h1 className="mt-6 text-headline-lg">{data.lesson.title}</h1>

            {!data.allowed && (
              <Card className="mt-8 p-6">
                <p className="text-body-md text-on-surface-variant">
                  Seu acesso a este curso não está vigente, então o vídeo fica bloqueado.
                </p>
              </Card>
            )}

            {data.allowed && !data.embedUrl && (
              <Card className="mt-8 p-6">
                <p className="text-body-md text-on-surface-variant">
                  Esta aula ainda não tem vídeo publicado.
                </p>
              </Card>
            )}

            {data.embedUrl && (
              <div className="mt-8 overflow-hidden rounded-2xl border border-outline-variant bg-surface-container">
                <div className="relative aspect-video">
                  <iframe
                    src={data.embedUrl}
                    title={data.lesson.title}
                    loading="lazy"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    className="absolute inset-0 size-full border-0"
                  />
                </div>
              </div>
            )}

            {data.lesson.description && (
              <p className="mt-8 text-body-lg text-on-surface-variant">
                {data.lesson.description}
              </p>
            )}
          </>
        )}
      </div>
    </SiteShell>
  );
}
