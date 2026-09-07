# Etapas 5 e 6 — Carrinho misto e Pedidos com pagamento simulado

O cadastro de bolsas, estoque e encomenda (Etapa 5) já existe no painel. O que falta é a compra: carrinho, finalização, pedidos e liberação de acesso aos cursos.

## O que o cliente passa a fazer

- Botão "Adicionar ao carrinho" nas páginas de curso e de bolsa (bolsa por encomenda também pode ser adicionada, com aviso de prazo).
- Ícone de carrinho no topo com contagem de itens; página do carrinho para ver, ajustar quantidade de bolsas e remover itens.
- Cursos entram sempre com quantidade 1 e não duplicam.
- Página de finalização: pede login (se ainda não estiver logado), nome e telefone; se houver bolsa no pedido, pede também endereço completo de entrega. Frete aparece como campo já preparado, hoje sempre R$ 0 com aviso "combinado após a confirmação".
- Botão "Finalizar pedido" cria o pedido e vai para a página do pedido, onde há um pagamento simulado: "Simular pagamento aprovado" ou "Simular pagamento recusado" (fica claro na tela que é teste, sem cobrança real).
- Ao aprovar, os cursos do pedido liberam acesso automaticamente pelo prazo de cada curso e aparecem em "Meus cursos"; bolsas ficam como "em preparação".
- "Minha conta" ganha a lista de pedidos com situação e link para os detalhes.

## O que a administradora passa a fazer

- Nova aba "Pedidos" no painel: lista com cliente, data, valor, situação de pagamento e situação de entrega.
- Detalhe do pedido com itens, dados de entrega e telefone.
- Alterar situação: em preparação, enviado, concluído, cancelado. Também pode confirmar pagamento manualmente (venda combinada por fora) e cancelar pedido.
- Estoque de bolsas em pronta entrega é reduzido quando o pagamento é confirmado; cancelar um pedido pago devolve o estoque.

## Detalhes técnicos

Banco (uma migração):
- `orders`: usuário, situação de pagamento (`pendente`, `pago`, `recusado`, `cancelado`, `reembolsado`), situação de atendimento (`aguardando`, `em-preparacao`, `enviado`, `concluido`, `cancelado`), subtotal, frete, total, dados de contato/entrega, provedor de pagamento (`mock`), id externo e payload do provedor (para o Mercado Pago depois), `created_at`/`updated_at` com trigger.
- `order_items`: pedido, tipo (`curso`/`bolsa`), `course_id`/`product_id` opcionais, título e preço congelados no momento da compra, quantidade, dias de acesso do curso.
- GRANTs para `authenticated` e `service_role`; RLS: cliente lê os próprios pedidos e itens, admin lê/escreve tudo; escrita de pedido só via função de servidor.
- Função `security definer` `confirm_order_payment(_order_id)`: idempotente — marca pago, cria os registros em `course_access` dos cursos do pedido (usando `access_duration_days`), baixa estoque das bolsas em pronta entrega. Um `cancel_order_payment` equivalente devolve estoque.

Aplicação:
- Carrinho no navegador (`localStorage` + contexto React), com preços revalidados no servidor na finalização — o total nunca vem do cliente.
- `src/lib/orders.functions.ts` com `createOrder` (autenticada, recalcula preços do banco, valida estoque), `listMyOrders`, `getMyOrder`, `simulatePayment` (chama o provedor abstrato), e funções admin `listOrders`, `getOrder`, `updateOrderStatus`, `confirmPaymentManually`.
- `src/lib/payments/provider.ts`: interface de pagamento com implementação `mock` hoje; Mercado Pago entra depois só trocando a implementação e um webhook em `src/routes/api/public/`.
- Novas rotas: `/carrinho`, `/checkout` e `/pedidos/$id` (protegidas quando exigem login), `/_authenticated/admin.pedidos` (lista + detalhe).
- Reuso do design system Kindred; sem novas dependências.
