import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import * as tus from "tus-js-client";

import { AdminGate } from "@/components/admin-gate";
import { Badge, Button, Card, Input, Label } from "@/design-system/kindred-library-51411a";
import { supabase } from "@/integrations/supabase/client";
import { courseLevels, imageKeys, resolveImage } from "@/data/catalog";
import {
  createVideoUpload,
  getLessonPlayback,
  refreshVideoStatus,
} from "@/lib/bunny.functions";

export const Route = createFileRoute("/_authenticated/admin/cursos/$id")({
  head: () => ({
    meta: [
      { title: "Editar curso — Painel Adribacci" },
      { name: "description", content: "Edite o curso, os módulos, as aulas e os vídeos." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Editar curso — Painel Adribacci" },
      { property: "og:description", content: "Edite o curso, os módulos, as aulas e os vídeos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditCourse,
});

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  description: string;
  level: string;
  price_cents: number;
  access_duration_days: number;
  image_key: string | null;
  image_alt: string;
  learning_outcomes: string[];
  materials: string[];
  featured: boolean;
  published: boolean;
};

const selectClass =
  "min-h-12 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-body-md text-on-surface";

function EditCourse() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<CourseRow | null>(null);
  const [saved, setSaved] = useState(false);

  const course = useQuery({
    queryKey: ["admin-curso", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("*").eq("id", id).single();
      if (error) throw error;
      setDraft(data as CourseRow);
      return data as CourseRow;
    },
  });

  const save = useMutation({
    mutationFn: async (row: CourseRow) => {
      const { id: rowId, ...fields } = row;
      const { error } = await supabase.from("courses").update(fields).eq("id", rowId);
      if (error) throw error;
    },
    onSuccess: () => {
      setSaved(true);
      void queryClient.invalidateQueries({ queryKey: ["admin-curso", id] });
    },
  });

  if (course.isPending || !draft) {
    return (
      <AdminGate>
        <p className="text-body-md text-on-surface-variant">Carregando…</p>
      </AdminGate>
    );
  }

  return (
    <AdminGate>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-display">{draft.title}</h1>
        <div className="flex gap-2">
          <Link to="/cursos/$slug" params={{ slug: draft.slug }}>
            <Button variant="outline-neutral" size="sm">
              Ver na loja
            </Button>
          </Link>
          <Link to="/admin/cursos">
            <Button variant="ghost" size="sm">
              Voltar
            </Button>
          </Link>
        </div>
      </div>

      <Card className="mt-8 p-6">
        <h2 className="text-headline-sm">Informações do curso</h2>
        <form
          className="mt-4 grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(draft);
          }}
        >
          <Field label="Nome">
            <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </Field>
          <Field label="Endereço na web (slug)">
            <Input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
          </Field>
          <Field label="Nível">
            <select
              value={draft.level}
              onChange={(e) => setDraft({ ...draft, level: e.target.value })}
              className={selectClass}
            >
              {courseLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Preço em centavos">
            <Input
              type="number"
              value={draft.price_cents}
              onChange={(e) => setDraft({ ...draft, price_cents: Number(e.target.value) })}
            />
          </Field>
          <Field label="Dias de acesso após a compra">
            <Input
              type="number"
              value={draft.access_duration_days}
              onChange={(e) =>
                setDraft({ ...draft, access_duration_days: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="Foto">
            <select
              value={draft.image_key ?? ""}
              onChange={(e) => setDraft({ ...draft, image_key: e.target.value })}
              className={selectClass}
            >
              <option value="">sem foto</option>
              {imageKeys.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Texto alternativo da foto">
            <Input
              value={draft.image_alt}
              onChange={(e) => setDraft({ ...draft, image_alt: e.target.value })}
            />
          </Field>
          <Field label="Resumo">
            <Input
              value={draft.short_description}
              onChange={(e) => setDraft({ ...draft, short_description: e.target.value })}
            />
          </Field>
          <Field label="O que a aluna vai aprender (separe por ponto e vírgula)" full>
            <Input
              value={draft.learning_outcomes.join("; ")}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  learning_outcomes: e.target.value
                    .split(";")
                    .map((v) => v.trim())
                    .filter(Boolean),
                })
              }
            />
          </Field>
          <Field label="Materiais necessários (separe por ponto e vírgula)" full>
            <Input
              value={draft.materials.join("; ")}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  materials: e.target.value
                    .split(";")
                    .map((v) => v.trim())
                    .filter(Boolean),
                })
              }
            />
          </Field>
          <Field label="Descrição completa" full>
            <textarea
              rows={5}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest p-4 text-body-md text-on-surface"
            />
          </Field>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-5">
            <label className="flex items-center gap-2 text-body-md">
              <input
                type="checkbox"
                checked={draft.published}
                onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
              />
              Publicado no site
            </label>
            <label className="flex items-center gap-2 text-body-md">
              <input
                type="checkbox"
                checked={draft.featured}
                onChange={(e) => setDraft({ ...draft, featured: e.target.checked })}
              />
              Destacar na página inicial
            </label>
            <Button type="submit" loading={save.isPending}>
              Salvar
            </Button>
            {saved && <span className="text-body-sm text-success">Salvo.</span>}
          </div>
          <div className="sm:col-span-2">
            <img
              src={resolveImage(draft.image_key)}
              alt={draft.image_alt}
              width={240}
              height={160}
              className="h-40 w-60 rounded-lg object-cover"
            />
          </div>
        </form>
      </Card>

      <Modules courseId={id} />
    </AdminGate>
  );
}

type LessonRow = {
  id: string;
  title: string;
  description: string;
  position: number;
  duration_minutes: number;
  bunny_video_id: string | null;
  video_status: string;
  free_preview: boolean;
};

function Modules({ courseId }: { courseId: string }) {
  const queryClient = useQueryClient();
  const [moduleTitle, setModuleTitle] = useState("");

  const modules = useQuery({
    queryKey: ["admin-modulos", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_modules")
        .select("id, title, position, lessons(id, title, description, position, duration_minutes, bunny_video_id, video_status, free_preview)")
        .eq("course_id", courseId)
        .order("position", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ["admin-modulos", courseId] });

  const addModule = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("course_modules").insert({
        course_id: courseId,
        title: moduleTitle,
        position: (modules.data?.length ?? 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setModuleTitle("");
      invalidate();
    },
  });

  const removeModule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("course_modules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return (
    <section className="mt-10">
      <h2 className="text-headline-md">Módulos e aulas</h2>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-64 flex-1">
          <Label htmlFor="novo-modulo">Novo módulo</Label>
          <Input
            id="novo-modulo"
            value={moduleTitle}
            onChange={(e) => setModuleTitle(e.target.value)}
            className="mt-2"
          />
        </div>
        <Button onClick={() => addModule.mutate()} disabled={moduleTitle.trim().length < 3}>
          Adicionar módulo
        </Button>
      </div>

      <div className="mt-6 space-y-5">
        {(modules.data ?? []).map((module) => (
          <Card key={module.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-headline-sm">
                {module.position}. {module.title}
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (confirm(`Apagar o módulo "${module.title}" e suas aulas?`)) {
                    removeModule.mutate(module.id);
                  }
                }}
              >
                Apagar módulo
              </Button>
            </div>
            <Lessons
              moduleId={module.id}
              lessons={((module.lessons ?? []) as LessonRow[]).sort(
                (a, b) => a.position - b.position,
              )}
              onChanged={invalidate}
            />
          </Card>
        ))}
      </div>
    </section>
  );
}

function Lessons({
  moduleId,
  lessons,
  onChanged,
}: {
  moduleId: string;
  lessons: LessonRow[];
  onChanged: () => void;
}) {
  const [title, setTitle] = useState("");

  const addLesson = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("lessons").insert({
        module_id: moduleId,
        title,
        position: lessons.length + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle("");
      onChanged();
    },
  });

  const removeLesson = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lessons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: onChanged,
  });

  const updateLesson = useMutation({
    mutationFn: async ({ id, fields }: { id: string; fields: Partial<LessonRow> }) => {
      const { error } = await supabase.from("lessons").update(fields).eq("id", id);
      if (error) throw error;
    },
    onSuccess: onChanged,
  });

  return (
    <div className="mt-4 space-y-3">
      {lessons.map((lesson) => (
        <div
          key={lesson.id}
          className="rounded-lg border border-outline-variant/60 bg-surface-container p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-body-md text-on-surface">
                {lesson.position}. {lesson.title}
              </span>
              <Badge variant={lesson.video_status === "pronto" ? "success" : "neutral"}>
                {lesson.video_status}
              </Badge>
              {lesson.duration_minutes > 0 && (
                <span className="text-body-sm text-on-surface-variant">
                  {lesson.duration_minutes} min
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                <input
                  type="checkbox"
                  checked={lesson.free_preview}
                  onChange={(e) =>
                    updateLesson.mutate({
                      id: lesson.id,
                      fields: { free_preview: e.target.checked },
                    })
                  }
                />
                Aula gratuita
              </label>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (confirm(`Apagar a aula "${lesson.title}"?`)) removeLesson.mutate(lesson.id);
                }}
              >
                Apagar
              </Button>
            </div>
          </div>
          <VideoUploader lesson={lesson} onChanged={onChanged} />
        </div>
      ))}

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <Label htmlFor={`nova-aula-${moduleId}`}>Nova aula</Label>
          <Input
            id={`nova-aula-${moduleId}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2"
          />
        </div>
        <Button
          size="sm"
          onClick={() => addLesson.mutate()}
          disabled={title.trim().length < 3}
        >
          Adicionar aula
        </Button>
      </div>
    </div>
  );
}

function VideoUploader({ lesson, onChanged }: { lesson: LessonRow; onChanged: () => void }) {
  const startUpload = useServerFn(createVideoUpload);
  const refresh = useServerFn(refreshVideoStatus);
  const fetchPlayback = useServerFn(getLessonPlayback);
  const fileRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);

  const playback = useQuery({
    queryKey: ["admin-playback", lesson.id],
    queryFn: () => fetchPlayback({ data: { lessonId: lesson.id } }),
    enabled: showPlayer,
    staleTime: 60 * 1000,
  });

  async function handleFile(file: File) {
    setError(null);
    setProgress(0);
    try {
      const signed = await startUpload({ data: { lessonId: lesson.id, title: lesson.title } });
      const upload = new tus.Upload(file, {
        endpoint: "https://video.bunnycdn.com/tusupload",
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          AuthorizationSignature: signed.signature,
          AuthorizationExpire: String(signed.expiration),
          VideoId: signed.videoId,
          LibraryId: String(signed.libraryId),
        },
        metadata: { filetype: file.type, title: lesson.title },
        onError: (err) => {
          setError(`Não foi possível enviar o vídeo: ${err.message}`);
          setProgress(null);
        },
        onProgress: (sent, total) => setProgress(Math.round((sent / total) * 100)),
        onSuccess: () => {
          setProgress(100);
          void refresh({ data: { lessonId: lesson.id } }).then(onChanged);
        },
      });
      upload.start();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao iniciar o envio.");
      setProgress(null);
    }
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
          {lesson.bunny_video_id ? "Trocar vídeo" : "Enviar vídeo"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => void refresh({ data: { lessonId: lesson.id } }).then(onChanged)}
        >
          Atualizar situação
        </Button>
        {lesson.bunny_video_id && (
          <>
            <Button size="sm" variant="ghost" onClick={() => setShowPlayer((v) => !v)}>
              {showPlayer ? "Fechar vídeo" : "Ver vídeo"}
            </Button>
            <Link
              to="/aula/$lessonId"
              params={{ lessonId: lesson.id }}
              className="text-body-sm text-on-surface-variant underline hover:text-primary"
            >
              Abrir a página da aula
            </Link>
          </>
        )}
        {progress !== null && (
          <span className="text-body-sm text-on-surface-variant">Enviando… {progress}%</span>
        )}
        {error && (
          <span role="alert" className="text-body-sm text-primary">
            {error}
          </span>
        )}
      </div>

      {showPlayer && (
        <div className="mt-3">
          {playback.isPending && (
            <p className="text-body-sm text-on-surface-variant">Preparando o vídeo…</p>
          )}
          {playback.error && (
            <p role="alert" className="text-body-sm text-primary">
              {playback.error instanceof Error
                ? playback.error.message
                : "Não foi possível abrir o vídeo."}
            </p>
          )}
          {playback.data && !playback.data.embedUrl && (
            <p className="text-body-sm text-on-surface-variant">
              O vídeo ainda está sendo preparado. Clique em “Atualizar situação” em alguns
              instantes.
            </p>
          )}
          {playback.data?.embedUrl && (
            <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
              <div className="relative aspect-video">
                <iframe
                  src={playback.data.embedUrl}
                  title={lesson.title}
                  loading="lazy"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  className="absolute inset-0 size-full border-0"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <Label>{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
