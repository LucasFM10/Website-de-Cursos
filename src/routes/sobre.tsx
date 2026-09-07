import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteShell } from "@/components/site-shell";
import { Button, Divider } from "@/design-system/kindred-library-51411a";
import { images } from "@/data/catalog";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre o ateliê — Adribacci" },
      {
        name: "description",
        content:
          "A história do ateliê Adribacci: crochê feito à mão, cursos gravados com a câmera sobre as mãos e bolsas produzidas em pequena escala.",
      },
      { property: "og:title", content: "Sobre o ateliê — Adribacci" },
      {
        property: "og:description",
        content: "Crochê feito à mão, cursos em vídeo e bolsas produzidas em pequena escala.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl px-5 py-14">
        <p className="text-overline text-accent-leather">Sobre</p>
        <h1 className="mt-3 text-display">Uma caixa de fios e muita paciência</h1>

        <img
          src={images.artesaRetrato}
          alt="Retrato da artesã no ateliê, cercada de fios de algodão e bolsas prontas"
          loading="lazy"
          width={1200}
          height={1200}
          className="mt-10 w-full rounded-2xl border border-outline-variant object-cover"
        />

        <div className="mt-10 space-y-6 text-body-lg text-on-surface-variant">
          <p>
            O ateliê Adribacci começou pequeno, com uma caixa de fios de algodão e encomendas de
            amigas. Cada bolsa pedida virava um desenho novo, um ponto testado, uma alça refeita
            três vezes até ficar do jeito certo.
          </p>
          <p>
            Com o tempo, as perguntas passaram a ser sobre como fazer. Foi daí que nasceram os
            cursos: aulas gravadas com a câmera sobre as mãos, em módulos curtos, para que ninguém
            precise pausar o vídeo dez vezes tentando entender de onde saiu aquele ponto.
          </p>
          <p>
            Hoje a Adribacci mantém as duas frentes lado a lado. Quem quer aprender, aprende no seu
            ritmo. Quem quer levar uma peça pronta, leva uma bolsa feita à mão, sem produção em
            série e sem pressa.
          </p>
        </div>

        <Divider className="my-12" />

        <div className="grid gap-8 sm:grid-cols-3">
          {[
            {
              title: "Feito à mão",
              text: "Nenhuma peça é industrializada. Cada bolsa passa inteira pelas mãos da artesã.",
            },
            {
              title: "Materiais escolhidos",
              text: "Algodão, fio de malha e ráfia natural, com ferragens e couro selecionados um a um.",
            },
            {
              title: "Ensino sem pressa",
              text: "Módulos curtos, repetição do ponto e gráfico em PDF para acompanhar offline.",
            },
          ].map((item) => (
            <div key={item.title}>
              <h2 className="text-headline-sm">{item.title}</h2>
              <p className="mt-3 text-body-md text-on-surface-variant">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap gap-3">
          <Link to="/cursos">
            <Button size="pill">Ver os cursos</Button>
          </Link>
          <Link to="/bolsas">
            <Button size="pill" variant="outline">
              Conhecer as bolsas
            </Button>
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}
