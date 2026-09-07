import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AdminGate } from "@/components/admin-gate";
import { Button, Card } from "@/design-system/kindred-library-51411a";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Painel do ateliê — Adribacci" },
      { name: "description", content: "Painel de administração dos cursos e bolsas da Adribacci." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Painel do ateliê — Adribacci" },
      { property: "og:description", content: "Administração dos cursos e bolsas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminHome,
});

function AdminHome() {
  const { data } = useQuery({
    queryKey: ["admin-resumo"],
    queryFn: async () => {
      const [courses, products, lessons, access] = await Promise.all([
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("lessons").select("id, bunny_video_id"),
        supabase.from("course_access").select("id, expires_at, revoked"),
      ]);
      const now = Date.now();
      return {
        courses: courses.count ?? 0,
        products: products.count ?? 0,
        lessons: lessons.data?.length ?? 0,
        withVideo: (lessons.data ?? []).filter((l) => l.bunny_video_id).length,
        activeAccess: (access.data ?? []).filter(
          (a) => !a.revoked && new Date(a.expires_at).getTime() > now,
        ).length,
      };
    },
  });

  const cards = [
    { label: "Cursos", value: data?.courses, to: "/admin/cursos" as const },
    { label: "Bolsas", value: data?.products, to: "/admin/bolsas" as const },
    { label: "Acessos ativos", value: data?.activeAccess, to: "/admin/acessos" as const },
  ];

  return (
    <AdminGate>
      <h1 className="text-display">Painel do ateliê</h1>
      <p className="mt-4 text-body-md text-on-surface-variant">
        Aqui você cria cursos, envia os vídeos das aulas, cadastra bolsas e libera o acesso das
        alunas.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label} className="p-6">
            <p className="text-overline text-on-surface-variant">{card.label}</p>
            <p className="mt-2 text-display text-primary">{card.value ?? "–"}</p>
            <Link to={card.to} className="mt-4 inline-block">
              <Button variant="ghost" size="sm">
                Abrir
              </Button>
            </Link>
          </Card>
        ))}
      </div>

      <Card className="mt-6 p-6">
        <p className="text-body-md text-on-surface-variant">
          {data ? `${data.withVideo} de ${data.lessons} aulas já têm vídeo enviado.` : "Carregando…"}
        </p>
      </Card>
    </AdminGate>
  );
}
