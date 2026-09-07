import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { SiteShell } from "@/components/site-shell";
import { Button, Card, Divider, Input, Label } from "@/design-system/kindred-library-51411a";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar na área de alunas — Adribacci" },
      {
        name: "description",
        content:
          "Acesse sua conta Adribacci para assistir às aulas de crochê liberadas para você.",
      },
      { property: "og:title", content: "Entrar na área de alunas — Adribacci" },
      {
        property: "og:description",
        content: "Área de alunas do ateliê Adribacci: aulas em vídeo liberadas por período.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const [mode, setMode] = useState<"entrar" | "criar">("entrar");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/minha-conta", replace: true });
    });
  }, [navigate]);

  const afterSignIn = async () => {
    await router.invalidate();
    void navigate({ to: "/minha-conta", replace: true });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    if (mode === "criar") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: window.location.origin,
        },
      });
      setBusy(false);
      if (error) {
        setMessage(error.message);
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        await afterSignIn();
      } else {
        setMessage("Conta criada. Confirme o e-mail que enviamos e depois entre.");
      }
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setMessage("E-mail ou senha não conferem.");
      return;
    }
    await afterSignIn();
  };

  const handleGoogle = async () => {
    setMessage(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setMessage("Não foi possível entrar com o Google agora.");
      return;
    }
    if (result.redirected) return;
    await afterSignIn();
  };

  return (
    <SiteShell>
      <div className="mx-auto max-w-md px-5 py-16">
        <p className="text-overline text-accent-leather">Área de alunas</p>
        <h1 className="mt-3 text-display">
          {mode === "entrar" ? "Entrar" : "Criar conta"}
        </h1>
        <p className="mt-4 text-body-md text-on-surface-variant">
          Suas aulas liberadas ficam aqui dentro, com o prazo de acesso de cada curso.
        </p>

        <Card className="mt-8 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "criar" && (
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                  className="mt-2"
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "criar" ? "new-password" : "current-password"}
                minLength={6}
                required
                className="mt-2"
              />
            </div>
            <Button type="submit" fullWidth loading={busy}>
              {mode === "entrar" ? "Entrar" : "Criar minha conta"}
            </Button>
          </form>

          <Divider className="my-6" />

          <Button variant="outline-neutral" fullWidth onClick={handleGoogle}>
            Entrar com o Google
          </Button>

          {message && (
            <p role="status" className="mt-4 text-body-sm text-on-surface-variant">
              {message}
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              setMode(mode === "entrar" ? "criar" : "entrar");
              setMessage(null);
            }}
            className="mt-6 text-body-sm text-primary underline"
          >
            {mode === "entrar" ? "Ainda não tenho conta" : "Já tenho conta"}
          </button>
        </Card>
      </div>
    </SiteShell>
  );
}
