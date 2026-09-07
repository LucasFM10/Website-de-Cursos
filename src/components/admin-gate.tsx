import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { SiteShell } from "@/components/site-shell";
import { Button, Card } from "@/design-system/kindred-library-51411a";
import { useSession } from "@/hooks/use-session";

const adminNav = [
  { to: "/admin", label: "Painel" },
  { to: "/admin/cursos", label: "Cursos" },
  { to: "/admin/bolsas", label: "Bolsas" },
  { to: "/admin/acessos", label: "Acessos" },
  { to: "/admin/pedidos", label: "Pedidos" },
] as const;

export function AdminGate({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = useSession();

  if (loading) {
    return (
      <SiteShell>
        <p className="mx-auto max-w-6xl px-5 py-16 text-body-md text-on-surface-variant">
          Carregando…
        </p>
      </SiteShell>
    );
  }

  if (!isAdmin) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-2xl px-5 py-24">
          <Card className="p-8 text-center">
            <h1 className="text-headline-md">Área restrita ao ateliê</h1>
            <p className="mt-4 text-body-md text-on-surface-variant">
              Esta parte do site é só para quem administra a Adribacci.
            </p>
            <Link to="/minha-conta" className="mt-6 inline-block">
              <Button>Ir para minha conta</Button>
            </Link>
          </Card>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-5 py-10">
        <nav aria-label="Painel do ateliê" className="flex flex-wrap gap-2">
          {adminNav.map((item) => (
            <Link key={item.to} to={item.to} activeOptions={{ exact: item.to === "/admin" }}>
              {({ isActive }) => (
                <Button variant={isActive ? "primary" : "outline-neutral"} size="pill">
                  {item.label}
                </Button>
              )}
            </Link>
          ))}
        </nav>
        <div className="mt-8">{children}</div>
      </div>
    </SiteShell>
  );
}
