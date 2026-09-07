# Adribacci — Etapa 1: site público e catálogo

Primeira entrega: a vitrine da marca. Qualquer visitante pode conhecer a Adribacci, navegar pelos cursos de crochê e pelas bolsas artesanais, e ver os detalhes de cada item. Sem login, sem carrinho e sem área administrativa nesta etapa — eles vêm nas etapas seguintes.

## Identidade visual

Direção artesanal e acolhedora, longe do visual genérico de tecnologia: fundo em tom de linho quente, terracota como cor principal, detalhes em couro, tipografia com serifa nos títulos e sans-serif suave nos textos. Uso da biblioteca de componentes já presente no projeto (botões, cartões, cartão de curso, barra superior), mantendo tudo consistente entre as páginas.

## Páginas

- **Início** — apresentação da marca, destaque de 3 cursos, destaque de bolsas, seção "sobre a artesã" e chamada para o catálogo.
- **Cursos** — lista de todos os cursos com foto, nome, nível, duração e preço, com filtro por nível.
- **Detalhe do curso** — foto, descrição, o que você vai aprender, lista de módulos e aulas, duração do acesso e preço, com botão "Quero este curso" (ainda sem checkout — leva a um aviso de que a compra chega em breve).
- **Bolsas** — grade de bolsas com foto, nome, preço e indicação de pronta-entrega ou encomenda.
- **Detalhe da bolsa** — galeria de fotos, descrição, materiais, medidas, preço e disponibilidade.
- **Sobre** — história da marca e do trabalho artesanal.
- **Contato** — formulário simples e canais de contato (o envio real de mensagens fica para etapa posterior; por ora exibe confirmação na tela).

Menu fixo no topo com Início, Cursos, Bolsas, Sobre e Contato, e rodapé com redes sociais e navegação.

## Conteúdo de exemplo

Cursos e bolsas fictícios (nomes, descrições, níveis e preços) com fotos geradas, no clima de crochê artesanal. Tudo marcado como exemplo para você substituir depois pelos itens reais. Nenhum telefone, endereço ou valor real será inventado como se fosse verdadeiro — os campos de contato ficam com marcadores claros até você me passar os dados.

## Detalhes técnicos

- Rotas TanStack Start dedicadas: `/`, `/cursos`, `/cursos/$slug`, `/bolsas`, `/bolsas/$slug`, `/sobre`, `/contato`; cabeçalho e rodapé em `__root.tsx`.
- Catálogo em um módulo de dados tipado (`src/data/catalog.ts`) com o mesmo formato do modelo conceitual do documento (curso → módulos → aulas; produto com estoque/encomenda), para que a troca por banco de dados na etapa 2 não exija reescrever as telas.
- Tokens da biblioteca Kindred aplicados em `src/styles.css`; nenhuma cor fixa nos componentes.
- SEO por página: título, descrição e metadados sociais próprios em cada rota; imagens com texto alternativo; um único H1 por página.
- Imagens de exemplo geradas e referenciadas como assets do projeto.

## Próximas etapas (fora desta entrega)

Etapa 2: painel administrativo e banco de dados no Lovable Cloud. Etapa 3: envio e reprodução de vídeo pelo Bunny Stream com suas chaves (as guardo com segurança quando chegarmos lá). Etapas 4 a 8: contas de aluno, acesso temporário, carrinho, pedidos, Mercado Pago e frete.
