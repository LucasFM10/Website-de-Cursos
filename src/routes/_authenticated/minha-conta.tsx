import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { SiteShell } from "@/components/site-shell";
import { Badge, Button, Card } from "@/design-system/kindred-library-51411a";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { formatDate, formatPrice, resolveImage } from "@/data/catalog";
import { listMyOrders } from "@/lib/orders.functions";

export const Route = createFileRoute("/_authenticated/minha-conta")({
  head: () => ({
    meta: [
      { title: "Minha conta — Adribacci" },
      { name: "description", content: "Seus cursos de crochê liberados no ateliê Adribacci." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Minha conta — Adribacci" },
      { property: "og:description", content: "Seus cursos de crochê liberados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user, isAdmin } = useSession();

  const { data, isPending } = useQuery({
    queryKey: ["meus-acessos", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_access")
        .select(
          "id, expires_at, starts_at, revoked, courses(id, slug, title, short_description, image_key, image_alt, level)",
        )
        .eq("user_id", user!.id)
        .order("expires_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const now = Date.now();

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-5 py-14">
        <p className="text-overline text-accent-leather">Área de alunas</p>
        <h1 className="mt-3 text-display">Meus cursos</h1>
        <p className="mt-4 text-body-md text-on-surface-variant">
          {user?.email}
        </p>

        {isAdmin && (
          <Link to="/admin" className="mt-6 inline-block">
            <Button variant="outline">Abrir painel do ateliê</Button>
          </Link>
        )}

        {isPending && (
          <p className="mt-10 text-body-md text-on-surface-variant">Carregando…</p>
        )}

        {!isPending && (data ?? []).length === 0 && (
          <Card className="mt-10 p-8">
            <h2 className="text-headline-sm">Nenhum curso liberado ainda</h2>
            <p className="mt-3 text-body-md text-on-surface-variant">
              Quando um curso for liberado para você, ele aparece aqui com o prazo de acesso.
            </p>
            <Link to="/cursos" className="mt-6 inline-block">
              <Button>Ver os cursos</Button>
            </Link>
          </Card>
        )}

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((row) => {
            const course = row.courses;
            if (!course) return null;
            const expired = new Date(row.expires_at).getTime() < now;
            const active = !row.revoked && !expired;
            return (
              <Card key={row.id} className="overflow-hidden">
                <img
                  src={resolveImage(course.image_key)}
                  alt={course.image_alt}
                  width={800}
                  height={600}
                  className="h-44 w-full object-cover"
                />
                <div className="p-5">
                  <Badge variant={active ? "leather" : "neutral"}>
                    {active ? "Acesso ativo" : row.revoked ? "Acesso cancelado" : "Acesso expirado"}
                  </Badge>
                  <h2 className="mt-3 text-headline-sm">{course.title}</h2>
                  <p className="mt-2 text-body-sm text-on-surface-variant">
                    {active
                      ? `Disponível até ${formatDate(row.expires_at)}`
                      : `Expirou em ${formatDate(row.expires_at)}`}
                  </p>
                  <Link
                    to="/meus-cursos/$slug"
                    params={{ slug: course.slug }}
                    className="mt-5 block"
                  >
                    <Button fullWidth variant={active ? "primary" : "outline-neutral"}>
                      {active ? "Assistir" : "Ver aulas"}
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>

        <MyOrders />
      </div>
    </SiteShell>
  );
}

const paymentLabels: Record<string, string> = {
  pendente: "Aguardando pagamento",
  pago: "Pago",
  recusado: "Pagamento recusado",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
};

function MyOrders() {
  const fetchOrders = useServerFn(listMyOrders);
  const { data, isPending } = useQuery({
    queryKey: ["meus-pedidos"],
    queryFn: () => fetchOrders(),
  });

  return (
    <section className="mt-20">
      <h2 className="text-headline-md">Meus pedidos</h2>

      {isPending && <p className="mt-4 text-body-md text-on-surface-variant">Carregando…</p>}

      {!isPending && (data ?? []).length === 0 && (
        <p className="mt-4 text-body-md text-on-surface-variant">
          Você ainda não fez nenhum pedido.
        </p>
      )}

      <ul className="mt-6 space-y-4">
        {(data ?? []).map((order) => (
          <li key={order.id}>
            <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="text-body-lg">
                  {order.items.length} item(ns) · {formatPrice(order.totalCents)}
                </p>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  Feito em {formatDate(order.createdAt)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={order.paymentStatus === "pago" ? "success" : "neutral"}>
                  {paymentLabels[order.paymentStatus] ?? order.paymentStatus}
                </Badge>
                <Link to="/pedidos/$id" params={{ id: order.id }}>
                  <Button variant="outline-neutral" size="sm">
                    Ver pedido
                  </Button>
                </Link>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
