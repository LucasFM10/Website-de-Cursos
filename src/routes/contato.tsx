import { createFileRoute } from "@tanstack/react-router";
import { AtSign, Mail, MessageCircle } from "lucide-react";
import { useState } from "react";

import { SiteShell } from "@/components/site-shell";
import { Button, Card, Input, Label } from "@/design-system/kindred-library-51411a";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — Ateliê Adribacci" },
      {
        name: "description",
        content:
          "Fale com o ateliê Adribacci sobre cursos de crochê, bolsas de pronta-entrega e peças sob encomenda.",
      },
      { property: "og:title", content: "Contato — Ateliê Adribacci" },
      {
        property: "og:description",
        content: "Dúvidas sobre cursos, bolsas prontas ou encomendas? Fale com o ateliê.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <SiteShell>
      <div className="mx-auto max-w-5xl px-5 py-14">
        <p className="text-overline text-accent-leather">Contato</p>
        <h1 className="mt-3 text-display">Vamos conversar</h1>
        <p className="mt-5 max-w-2xl text-body-lg text-on-surface-variant">
          Dúvidas sobre um curso, uma bolsa de pronta-entrega ou uma encomenda? Deixe sua mensagem
          e o ateliê responde.
        </p>

        <div className="mt-12 grid gap-12 lg:grid-cols-3">
          <form
            className="space-y-6 lg:col-span-2"
            onSubmit={(event) => {
              event.preventDefault();
              setSent(true);
            }}
          >
            <div>
              <Label htmlFor="nome">Seu nome</Label>
              <Input id="nome" name="nome" required className="mt-2" placeholder="Como te chamo?" />
            </div>
            <div>
              <Label htmlFor="email">Seu e-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="mt-2"
                placeholder="nome@email.com"
              />
            </div>
            <div>
              <Label htmlFor="mensagem">Mensagem</Label>
              <textarea
                id="mensagem"
                name="mensagem"
                required
                rows={6}
                placeholder="Conte o que você procura."
                className="mt-2 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-1 focus:outline-primary"
              />
            </div>
            <Button type="submit">Enviar mensagem</Button>
            {sent && (
              <p
                role="status"
                className="rounded-lg bg-surface-container px-4 py-3 text-body-md text-on-surface-variant"
              >
                Obrigada pela mensagem! O envio automático de e-mails entra na próxima etapa do
                site — por enquanto nada é enviado de verdade.
              </p>
            )}
          </form>

          <Card className="p-6">
            <h2 className="text-headline-sm">Outros canais</h2>
            <ul className="mt-5 space-y-4 text-body-md text-on-surface-variant">
              <li className="flex items-center gap-3">
                <Mail className="size-4 text-accent-leather" aria-hidden />
                [e-mail a definir]
              </li>
              <li className="flex items-center gap-3">
                <MessageCircle className="size-4 text-accent-leather" aria-hidden />
                [WhatsApp a definir]
              </li>
              <li className="flex items-center gap-3">
                <AtSign className="size-4 text-accent-leather" aria-hidden />
                [perfil a definir]
              </li>
            </ul>
            <p className="mt-6 text-body-sm text-on-surface-variant">
              Me envie os dados reais de contato e eu coloco no lugar destes marcadores.
            </p>
          </Card>
        </div>
      </div>
    </SiteShell>
  );
}
