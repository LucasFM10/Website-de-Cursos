import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { AtSign, Mail, Menu, ShoppingBag, User, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/design-system/kindred-library-51411a";
import { useCart } from "@/lib/cart";

function CartLink({ onNavigate }: { onNavigate?: () => void }) {
  const { count, hydrated } = useCart();

  return (
    <Link
      to="/carrinho"
      onClick={onNavigate}
      activeProps={{ className: "text-primary" }}
      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-label text-on-surface-variant transition-colors hover:text-primary"
    >
      <ShoppingBag className="size-4" aria-hidden />
      Carrinho
      {hydrated && count > 0 && (
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-body-sm text-on-primary">
          {count}
        </span>
      )}
    </Link>
  );
}

const navItems = [
  { to: "/", label: "Início" },
  { to: "/cursos", label: "Cursos" },
  { to: "/bolsas", label: "Bolsas" },
  { to: "/sobre", label: "Sobre" },
  { to: "/contato", label: "Contato" },
] as const;

function AccountLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (loading) return null;

  if (!user) {
    return (
      <Link
        to="/auth"
        onClick={onNavigate}
        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-label text-on-surface-variant transition-colors hover:text-primary"
      >
        <User className="size-4" aria-hidden />
        Entrar
      </Link>
    );
  }

  async function handleSignOut() {
    onNavigate?.();
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  return (
    <>
      <Link
        to="/minha-conta"
        onClick={onNavigate}
        activeProps={{ className: "text-primary" }}
        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-label text-on-surface-variant transition-colors hover:text-primary"
      >
        <User className="size-4" aria-hidden />
        Minha conta
      </Link>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => void handleSignOut()}
        className="px-3 py-2 text-on-surface-variant hover:text-primary"
      >
        Sair
      </Button>
    </>
  );
}

function Wordmark() {
  return (
    <Link
      to="/"
      className="text-headline-md text-primary"
    >
      Adribacci
      <span className="ml-2 hidden align-middle text-overline text-on-surface-variant sm:inline">
        ateliê de crochê
      </span>
    </Link>
  );
}

function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-outline-variant/50 bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Wordmark />
        <nav aria-label="Navegação principal" className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "text-primary" }}
              className="rounded-lg px-3 py-2 text-label text-on-surface-variant transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
          <CartLink />
          <AccountLinks />
        </nav>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          className="inline-flex size-11 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-on-surface/5 md:hidden"
        >
          {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        </button>
      </div>
      {open && (
        <nav
          aria-label="Navegação principal"
          className="border-t border-outline-variant/50 bg-surface px-5 pb-4 md:hidden"
        >
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "text-primary" }}
              onClick={() => setOpen(false)}
              className="block border-b border-outline-variant/40 py-3 text-body-lg text-on-surface-variant last:border-0"
            >
              {item.label}
            </Link>
          ))}
          <div className="flex flex-col items-start pt-2">
            <CartLink onNavigate={() => setOpen(false)} />
            <AccountLinks onNavigate={() => setOpen(false)} />
          </div>
        </nav>
      )}
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-outline-variant/60 bg-surface-container-low">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-3">
        <div>
          <p className="text-headline-sm text-primary">Adribacci</p>
          <p className="mt-3 max-w-xs text-body-md text-on-surface-variant">
            Cursos de crochê e bolsas feitas à mão, uma peça por vez.
          </p>
        </div>
        <div>
          <p className="text-overline text-on-surface-variant">Navegar</p>
          <ul className="mt-4 space-y-2">
            {navItems.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="text-body-md text-on-surface-variant transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-overline text-on-surface-variant">Contato</p>
          <ul className="mt-4 space-y-3 text-body-md text-on-surface-variant">
            <li className="flex items-center gap-2">
              <Mail className="size-4 text-accent-leather" aria-hidden />
              <span>[e-mail a definir]</span>
            </li>
            <li className="flex items-center gap-2">
              <AtSign className="size-4 text-accent-leather" aria-hidden />
              <span>[perfil a definir]</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-outline-variant/60 px-5 py-6">
        <p className="mx-auto max-w-6xl text-body-sm text-on-surface-variant">
          © {new Date().getFullYear()} Adribacci. Catálogo de demonstração com peças e preços de
          exemplo.
        </p>
      </div>
    </footer>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
