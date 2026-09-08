import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { SiteShell } from "@/components/site-shell";
import { Button, Card, Input, Label } from "@/design-system/kindred-library-51411a";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar na area de alunas - Adribacci" },
      {
        name: "description",
        content:
          "Acesse sua conta Adribacci para assistir as aulas de croche liberadas para voce.",
      },
      { property: "og:title", content: "Entrar na area de alunas - Adribacci" },
      {
        property: "og:description",
        content: "Area de alunas do atelie Adribacci: aulas em video liberadas por periodo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  ssr: false,
  component: AuthPage,
});

type AuthMode = "entrar" | "criar" | "confirmar";

function normalizeBrazilPhone(value: string): string | null {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  const nationalNumber =
    trimmed.startsWith("+") || (digits.startsWith("55") && digits.length > 11)
      ? digits.replace(/^55/, "")
      : digits;
  const normalized = `+55${nationalNumber}`;

  return /^\+[1-9]\d{9,14}$/.test(normalized) ? normalized : null;
}

function AuthPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("entrar");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  const normalizedPhone = useMemo(() => normalizeBrazilPhone(phone), [phone]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/minha-conta", replace: true });
    });
  }, [navigate]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setInterval(() => {
      setResendIn((current) => Math.max(current - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  const afterSignIn = async () => {
    await router.invalidate();
    void navigate({ to: "/minha-conta", replace: true });
  };

  const handlePasswordAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    if (!normalizedPhone) {
      setMessage("Informe um WhatsApp valido com DDD.");
      return;
    }

    if (password.length < 6) {
      setMessage("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    setBusy(true);

    if (mode === "criar") {
      const { data, error } = await supabase.auth.signUp({
        phone: normalizedPhone,
        password,
        options: {
          data: { full_name: name.trim() },
        },
      });
      setBusy(false);

      if (error) {
        setMessage("Nao foi possivel criar a conta agora.");
        return;
      }

      if (data.session) {
        await afterSignIn();
        return;
      }

      setMode("confirmar");
      setCode("");
      setResendIn(60);
      setMessage("Enviamos um codigo de confirmacao para seu WhatsApp.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      phone: normalizedPhone,
      password,
    });
    setBusy(false);

    if (error) {
      setMessage("WhatsApp ou senha nao conferem. Se a conta for nova, confirme o codigo recebido.");
      return;
    }

    await afterSignIn();
  };

  const resendConfirmation = async () => {
    setMessage(null);

    if (!normalizedPhone) {
      setMessage("Informe um WhatsApp valido com DDD.");
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.resend({
      type: "sms",
      phone: normalizedPhone,
    });
    setBusy(false);

    if (error) {
      setMessage("Nao foi possivel reenviar o codigo agora.");
      return;
    }

    setMode("confirmar");
    setCode("");
    setResendIn(60);
    setMessage("Enviamos um novo codigo para seu WhatsApp.");
  };

  const verifyPhone = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    if (!normalizedPhone) {
      setMode("criar");
      setMessage("Informe o WhatsApp novamente.");
      return;
    }

    const token = code.replace(/\D/g, "");
    if (token.length !== 6) {
      setMessage("Digite o codigo de 6 numeros.");
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: normalizedPhone,
      token,
      type: "sms",
    });
    setBusy(false);

    if (error) {
      setMessage("Codigo invalido ou expirado.");
      return;
    }

    await afterSignIn();
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setCode("");
    setMessage(null);
  };

  return (
    <SiteShell>
      <div className="mx-auto max-w-md px-5 py-16">
        <p className="text-overline text-accent-leather">Area de alunas</p>
        <h1 className="mt-3 text-display">
          {mode === "criar" ? "Criar conta" : mode === "confirmar" ? "Confirmar WhatsApp" : "Entrar"}
        </h1>
        <p className="mt-4 text-body-md text-on-surface-variant">
          Suas aulas liberadas ficam aqui dentro, com o prazo de acesso de cada curso.
        </p>

        <Card className="mt-8 p-6">
          {mode === "confirmar" ? (
            <form onSubmit={verifyPhone} className="space-y-4">
              <div>
                <Label htmlFor="otp">Codigo recebido no WhatsApp</Label>
                <Input
                  id="otp"
                  type="text"
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="_ _ _ _ _ _"
                  required
                  className="mt-2 text-center text-headline-sm tracking-[0.35em]"
                />
              </div>
              <Button type="submit" fullWidth loading={busy}>
                Confirmar
              </Button>
              <Button
                type="button"
                variant="outline-neutral"
                fullWidth
                disabled={busy || resendIn > 0}
                onClick={() => void resendConfirmation()}
              >
                {resendIn > 0 ? `Reenviar codigo em ${resendIn}s` : "Reenviar codigo"}
              </Button>
              <button
                type="button"
                onClick={() => switchMode("entrar")}
                className="w-full text-body-sm text-primary underline"
              >
                Voltar para entrar
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordAuth} className="space-y-4">
              {mode === "criar" && (
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    required
                    className="mt-2"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="phone">WhatsApp</Label>
                <div className="mt-2 grid grid-cols-[88px_1fr] gap-2">
                  <Input id="country" value="+55" disabled aria-label="Codigo do pais" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    autoComplete="tel-national"
                    inputMode="tel"
                    placeholder="85 99999 9999"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={mode === "criar" ? "new-password" : "current-password"}
                  minLength={6}
                  required
                  className="mt-2"
                />
              </div>
              <Button type="submit" fullWidth loading={busy}>
                {mode === "criar" ? "Criar minha conta" : "Entrar"}
              </Button>
              {mode === "entrar" && (
                <Button
                  type="button"
                  variant="outline-neutral"
                  fullWidth
                  disabled={busy || resendIn > 0}
                  onClick={() => void resendConfirmation()}
                >
                  {resendIn > 0 ? `Reenviar confirmacao em ${resendIn}s` : "Confirmar WhatsApp"}
                </Button>
              )}
              <button
                type="button"
                onClick={() => switchMode(mode === "entrar" ? "criar" : "entrar")}
                className="w-full text-body-sm text-primary underline"
              >
                {mode === "entrar" ? "Ainda nao tenho conta" : "Ja tenho conta"}
              </button>
            </form>
          )}

          {message && (
            <p role="status" className="mt-4 text-body-sm text-on-surface-variant">
              {message}
            </p>
          )}
        </Card>
      </div>
    </SiteShell>
  );
}
