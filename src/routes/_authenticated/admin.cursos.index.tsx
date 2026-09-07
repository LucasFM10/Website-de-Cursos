import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AdminGate } from "@/components/admin-gate";
import { Badge, Button, Card, Input, Label } from "@/design-system/kindred-library-51411a";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/data/catalog";

export const Route = createFileRoute("/_authenticated/admin/cursos/")({
  head: () => ({
    meta: [
      { title: "Cursos — Painel Adribacci" },
      { name: "description", content: "Gerencie os cursos de crochê do ateliê Adribacci." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Cursos — Painel Adribacci" },
      { property: "og:description", content: "Gerencie os cursos de crochê do ateliê." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminCourses,
});

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function AdminCourses() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const { data, isPending } = useQuery({
    queryKey: ["admin-cursos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, slug, title, level, price_cents, published, sort_order, course_modules(id, lessons(id))")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: created, error } = await supabase
        .from("courses")
        .insert({
          title,
          slug: slugify(title),
          published: false,
          sort_order: (data?.length ?? 0) + 1,
        })
        .select("id")
        .single();
      if (error) throw error;
      return created;
    },
    onSuccess: () => {
      setTitle("");
      setMessage("Curso criado como rascunho. Abra para preencher os detalhes.");
      void queryClient.invalidateQueries({ queryKey: ["admin-cursos"] });
    },
    onError: (error: Error) => setMessage(error.message),
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase.from("courses").update({ published }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin-cursos"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin-cursos"] }),
  });

  return (
    <AdminGate>
      <h1 className="text-display">Cursos</h1>

      <Card className="mt-8 p-6">
        <h2 className="text-headline-sm">Criar curso</h2>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-64 flex-1">
            <Label htmlFor="novo-curso">Nome do curso</Label>
            <Input
              id="novo-curso"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Bolsa de praia em algodão"
              className="mt-2"
            />
          </div>
          <Button
            onClick={() => create.mutate()}
            disabled={title.trim().length < 3}
            loading={create.isPending}
          >
            Criar rascunho
          </Button>
        </div>
        {message && (
          <p role="status" className="mt-3 text-body-sm text-on-surface-variant">
            {message}
          </p>
        )}
      </Card>

      {isPending && <p className="mt-8 text-body-md text-on-surface-variant">Carregando…</p>}

      <div className="mt-8 space-y-4">
        {(data ?? []).map((course) => {
          const lessons = (course.course_modules ?? []).reduce(
            (sum, m) => sum + (m.lessons?.length ?? 0),
            0,
          );
          return (
            <Card key={course.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-headline-sm">{course.title}</h2>
                  <Badge variant={course.published ? "leather" : "neutral"}>
                    {course.published ? "Publicado" : "Rascunho"}
                  </Badge>
                </div>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  {course.level} · {formatPrice(course.price_cents)} · {lessons} aulas
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to="/admin/cursos/$id" params={{ id: course.id }}>
                  <Button size="sm">Editar</Button>
                </Link>
                <Button
                  size="sm"
                  variant="outline-neutral"
                  onClick={() =>
                    togglePublish.mutate({ id: course.id, published: !course.published })
                  }
                >
                  {course.published ? "Despublicar" : "Publicar"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm(`Apagar "${course.title}" e todas as suas aulas?`)) {
                      remove.mutate(course.id);
                    }
                  }}
                >
                  Apagar
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </AdminGate>
  );
}
