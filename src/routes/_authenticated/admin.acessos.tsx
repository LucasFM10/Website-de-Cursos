import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AdminGate } from "@/components/admin-gate";
import { Badge, Button, Card, Input, Label } from "@/design-system/kindred-library-51411a";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/data/catalog";

export const Route = createFileRoute("/_authenticated/admin/acessos")({
  head: () => ({
    meta: [
      { title: "Acessos — Painel Adribacci" },
      { name: "description", content: "Libere e cancele o acesso das alunas aos cursos." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Acessos — Painel Adribacci" },
      { property: "og:description", content: "Libere e cancele o acesso das alunas aos cursos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminAccess,
});

function AdminAccess() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [days, setDays] = useState(180);
  const [message, setMessage] = useState<string | null>(null);

  const people = useQuery({
    queryKey: ["admin-pessoas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const courses = useQuery({
    queryKey: ["admin-cursos-simples"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, access_duration_days")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const access = useQuery({
    queryKey: ["admin-acessos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_access")
        .select("id, expires_at, revoked, user_id, courses(title), profiles:user_id(full_name, email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const grant = useMutation({
    mutationFn: async () => {
      const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase.from("course_access").insert({
        user_id: userId,
        course_id: courseId,
        starts_at: new Date().toISOString(),
        expires_at: expires,
        revoked: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("Acesso liberado.");
      void queryClient.invalidateQueries({ queryKey: ["admin-acessos"] });
    },
    onError: (error: Error) => setMessage(error.message),
  });

  const setRevoked = useMutation({
    mutationFn: async ({ id, revoked }: { id: string; revoked: boolean }) => {
      const { error } = await supabase.from("course_access").update({ revoked }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin-acessos"] }),
  });

  const expireNow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("course_access")
        .update({ expires_at: new Date(Date.now() - 60 * 1000).toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin-acessos"] }),
  });

  const selectClass =
    "min-h-12 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-body-md text-on-surface";

  return (
    <AdminGate>
      <h1 className="text-display">Acessos aos cursos</h1>
      <p className="mt-4 text-body-md text-on-surface-variant">
        Libere um curso para uma aluna por um período. Ao expirar ou ser cancelado, o vídeo deixa
        de abrir.
      </p>

      <Card className="mt-8 p-6">
        <h2 className="text-headline-sm">Liberar acesso</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="aluna">Aluna</Label>
            <select
              id="aluna"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className={`mt-2 ${selectClass}`}
            >
              <option value="">Escolha…</option>
              {(people.data ?? []).map((person) => (
                <option key={person.id} value={person.id}>
                  {person.full_name || person.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="curso">Curso</Label>
            <select
              id="curso"
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
                const found = (courses.data ?? []).find((c) => c.id === e.target.value);
                if (found) setDays(found.access_duration_days);
              }}
              className={`mt-2 ${selectClass}`}
            >
              <option value="">Escolha…</option>
              {(courses.data ?? []).map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="dias">Dias de acesso</Label>
            <Input
              id="dias"
              type="number"
              min={1}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="mt-2"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => grant.mutate()}
              disabled={!userId || !courseId}
              loading={grant.isPending}
            >
              Liberar
            </Button>
          </div>
        </div>
        {message && (
          <p role="status" className="mt-3 text-body-sm text-on-surface-variant">
            {message}
          </p>
        )}
      </Card>

      <div className="mt-8 space-y-3">
        {(access.data ?? []).map((row) => {
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          const person = (row as any).profiles;
          const expired = new Date(row.expires_at).getTime() < Date.now();
          const active = !row.revoked && !expired;
          return (
            <Card key={row.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-headline-sm">{row.courses?.title}</h2>
                  <Badge variant={active ? "leather" : "neutral"}>
                    {active ? "Ativo" : row.revoked ? "Cancelado" : "Expirado"}
                  </Badge>
                </div>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  {person?.full_name || person?.email} · até {formatDate(row.expires_at)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline-neutral"
                  onClick={() => setRevoked.mutate({ id: row.id, revoked: !row.revoked })}
                >
                  {row.revoked ? "Reativar" : "Cancelar"}
                </Button>
                {!expired && (
                  <Button size="sm" variant="ghost" onClick={() => expireNow.mutate(row.id)}>
                    Expirar agora
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </AdminGate>
  );
}
