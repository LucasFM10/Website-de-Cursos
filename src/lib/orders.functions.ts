import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getPaymentProvider, type PaymentOutcome } from "@/lib/payments/provider";

export type OrderItemKind = "curso" | "bolsa";

export interface OrderItemDTO {
  id: string;
  kind: OrderItemKind;
  courseId: string | null;
  productId: string | null;
  courseSlug: string | null;
  productSlug: string | null;
  title: string;
  unitPriceCents: number;
  quantity: number;
  accessDurationDays: number | null;
}

export interface OrderDTO {
  id: string;
  createdAt: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  shippingAddress: string;
  requiresShipping: boolean;
  notes: string;
  paidAt: string | null;
  items: OrderItemDTO[];
}

const ORDER_SELECT =
  "id, created_at, payment_status, fulfillment_status, subtotal_cents, shipping_cents, total_cents, customer_name, customer_phone, shipping_address, requires_shipping, notes, paid_at, user_id, order_items(id, item_type, course_id, product_id, title, unit_price_cents, quantity, access_duration_days, courses(slug), products(slug))";

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapOrder(row: any, email: string | null = null): OrderDTO {
  return {
    id: row.id,
    createdAt: row.created_at,
    paymentStatus: row.payment_status,
    fulfillmentStatus: row.fulfillment_status,
    subtotalCents: row.subtotal_cents,
    shippingCents: row.shipping_cents,
    totalCents: row.total_cents,
    customerName: row.customer_name ?? "",
    customerPhone: row.customer_phone ?? "",
    customerEmail: email,
    shippingAddress: row.shipping_address ?? "",
    requiresShipping: row.requires_shipping,
    notes: row.notes ?? "",
    paidAt: row.paid_at ?? null,
    items: (row.order_items ?? []).map((i: any) => ({
      id: i.id,
      kind: i.item_type as OrderItemKind,
      courseId: i.course_id,
      productId: i.product_id,
      courseSlug: i.courses?.slug ?? null,
      productSlug: i.products?.slug ?? null,
      title: i.title,
      unitPriceCents: i.unit_price_cents,
      quantity: i.quantity,
      accessDurationDays: i.access_duration_days,
    })),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

interface CartInput {
  items: { kind: OrderItemKind; id: string; quantity: number }[];
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  notes: string;
}

export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: CartInput) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const courseIds = data.items.filter((i) => i.kind === "curso").map((i) => i.id);
    const productIds = data.items.filter((i) => i.kind === "bolsa").map((i) => i.id);

    if (courseIds.length === 0 && productIds.length === 0) {
      throw new Error("Seu carrinho está vazio.");
    }

    const [coursesRes, productsRes] = await Promise.all([
      courseIds.length
        ? supabase
            .from("courses")
            .select("id, title, price_cents, access_duration_days, published")
            .in("id", courseIds)
        : Promise.resolve({ data: [], error: null }),
      productIds.length
        ? supabase
            .from("products")
            .select("id, name, price_cents, availability, stock, published")
            .in("id", productIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (coursesRes.error) throw new Error(coursesRes.error.message);
    if (productsRes.error) throw new Error(productsRes.error.message);

    type NewItem = {
      item_type: OrderItemKind;
      course_id: string | null;
      product_id: string | null;
      title: string;
      unit_price_cents: number;
      quantity: number;
      access_duration_days: number | null;
    };

    const items: NewItem[] = [];

    for (const wanted of data.items) {
      if (wanted.kind === "curso") {
        const course = (coursesRes.data ?? []).find((c) => c.id === wanted.id);
        if (!course || !course.published) throw new Error("Um dos cursos não está mais disponível.");
        items.push({
          item_type: "curso",
          course_id: course.id,
          product_id: null,
          title: course.title,
          unit_price_cents: course.price_cents,
          quantity: 1,
          access_duration_days: course.access_duration_days,
        });
      } else {
        const product = (productsRes.data ?? []).find((p) => p.id === wanted.id);
        if (!product || !product.published) throw new Error("Uma das bolsas não está mais disponível.");
        const quantity = Math.max(1, Math.min(20, Math.trunc(wanted.quantity)));
        if (product.availability === "pronta-entrega" && product.stock < quantity) {
          throw new Error(`Temos apenas ${product.stock} unidade(s) de "${product.name}" no ateliê.`);
        }
        items.push({
          item_type: "bolsa",
          course_id: null,
          product_id: product.id,
          title: product.name,
          unit_price_cents: product.price_cents,
          quantity,
          access_duration_days: null,
        });
      }
    }

    const subtotal = items.reduce((sum, i) => sum + i.unit_price_cents * i.quantity, 0);
    const requiresShipping = items.some((i) => i.item_type === "bolsa");
    // Frete preparado (RF-CHK-003): a regra de cálculo entra em etapa posterior.
    const shipping = 0;

    if (requiresShipping && data.shippingAddress.trim().length < 10) {
      throw new Error("Informe o endereço completo de entrega.");
    }
    if (data.customerName.trim().length < 3) throw new Error("Informe seu nome completo.");
    if (data.customerPhone.trim().length < 8) throw new Error("Informe um telefone de contato.");

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        subtotal_cents: subtotal,
        shipping_cents: shipping,
        total_cents: subtotal + shipping,
        customer_name: data.customerName.trim(),
        customer_phone: data.customerPhone.trim(),
        shipping_address: requiresShipping ? data.shippingAddress.trim() : "",
        requires_shipping: requiresShipping,
        notes: data.notes.trim(),
        payment_provider: getPaymentProvider().name,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(items.map((i) => ({ ...i, order_id: order.id })));
    if (itemsError) throw new Error(itemsError.message);

    const intent = await getPaymentProvider().createPayment({
      orderId: order.id,
      amountCents: subtotal + shipping,
    });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("orders")
      .update({ payment_external_id: intent.externalId, payment_payload: intent.raw as unknown as Record<string, never> })
      .eq("id", order.id);

    return { orderId: order.id as string };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => mapOrder(row));
  });

export const getMyOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { orderId: string }) => data)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("id", data.orderId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? mapOrder(row) : null;
  });

export const simulatePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { orderId: string; outcome: PaymentOutcome }) => data)
  .handler(async ({ data, context }) => {
    const { data: order, error } = await context.supabase
      .from("orders")
      .select("id, user_id, total_cents, payment_status")
      .eq("id", data.orderId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order || order.user_id !== context.userId) throw new Error("Pedido não encontrado.");
    if (order.payment_status === "pago") return { paymentStatus: "pago" as const };

    const intent = await getPaymentProvider().resolvePayment({
      orderId: order.id,
      amountCents: order.total_cents,
      outcome: data.outcome,
    });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("orders")
      .update({ payment_external_id: intent.externalId, payment_payload: intent.raw as unknown as Record<string, never> })
      .eq("id", order.id);

    if (intent.status === "pago") {
      const { error: rpcError } = await supabaseAdmin.rpc(
        "confirm_order_payment" as never,
        { _order_id: order.id, _external_id: intent.externalId } as never,
      );
      if (rpcError) throw new Error(rpcError.message);
      return { paymentStatus: "pago" as const };
    }

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({ payment_status: "recusado" })
      .eq("id", order.id);
    if (updateError) throw new Error(updateError.message);
    return { paymentStatus: "recusado" as const };
  });

async function assertAdmin(context: { supabase: { rpc: unknown }; userId: string }) {
  const supabase = context.supabase as unknown as {
    rpc: (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { message: string } | null }>;
  };
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (data !== true) throw new Error("Acesso restrito ao ateliê.");
}

export const listOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("orders")
      .select(ORDER_SELECT)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const userIds = [...new Set((data ?? []).map((row) => row.user_id))];
    const { data: profiles } = userIds.length
      ? await context.supabase.from("profiles").select("id, email").in("id", userIds)
      : { data: [] };
    const emailById = new Map((profiles ?? []).map((p) => [p.id, p.email]));

    return (data ?? []).map((row) => mapOrder(row, emailById.get(row.user_id) ?? null));
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { orderId: string; fulfillmentStatus: string }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const allowed = ["aguardando", "em-preparacao", "enviado", "concluido", "cancelado"];
    if (!allowed.includes(data.fulfillmentStatus)) throw new Error("Situação inválida.");
    const { error } = await context.supabase
      .from("orders")
      .update({ fulfillment_status: data.fulfillmentStatus })
      .eq("id", data.orderId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const confirmPaymentManually = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { orderId: string }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc(
      "confirm_order_payment" as never,
      { _order_id: data.orderId, _external_id: null } as never,
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const cancelOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { orderId: string }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc(
      "cancel_order_payment" as never,
      { _order_id: data.orderId } as never,
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
