CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_status text NOT NULL DEFAULT 'pendente',
  fulfillment_status text NOT NULL DEFAULT 'aguardando',
  subtotal_cents integer NOT NULL DEFAULT 0,
  shipping_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL DEFAULT 0,
  customer_name text NOT NULL DEFAULT '',
  customer_phone text NOT NULL DEFAULT '',
  shipping_address text NOT NULL DEFAULT '',
  requires_shipping boolean NOT NULL DEFAULT false,
  payment_provider text NOT NULL DEFAULT 'mock',
  payment_external_id text,
  payment_payload jsonb,
  notes text NOT NULL DEFAULT '',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY orders_select_own ON public.orders FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY orders_insert_own ON public.orders FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY orders_admin_update ON public.orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY orders_admin_delete ON public.orders FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  title text NOT NULL,
  unit_price_cents integer NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  access_duration_days integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY order_items_select_own ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id
    AND (o.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY order_items_insert_own ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid()));
CREATE POLICY order_items_admin_write ON public.order_items FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY order_items_admin_delete ON public.order_items FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX orders_user_idx ON public.orders(user_id, created_at DESC);
CREATE INDEX order_items_order_idx ON public.order_items(order_id);

CREATE OR REPLACE FUNCTION public.confirm_order_payment(_order_id uuid, _external_id text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  o public.orders;
  it record;
BEGIN
  SELECT * INTO o FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF o.id IS NULL THEN RAISE EXCEPTION 'Pedido não encontrado'; END IF;
  IF o.payment_status = 'pago' THEN RETURN; END IF;

  UPDATE public.orders
     SET payment_status = 'pago',
         paid_at = now(),
         payment_external_id = COALESCE(_external_id, payment_external_id),
         fulfillment_status = CASE WHEN requires_shipping THEN 'em-preparacao' ELSE 'concluido' END
   WHERE id = _order_id;

  FOR it IN SELECT * FROM public.order_items WHERE order_id = _order_id LOOP
    IF it.item_type = 'curso' AND it.course_id IS NOT NULL THEN
      INSERT INTO public.course_access (user_id, course_id, starts_at, expires_at, note)
      VALUES (o.user_id, it.course_id, now(),
              now() + (COALESCE(it.access_duration_days, 180) || ' days')::interval,
              'Liberado pelo pedido ' || _order_id);
    ELSIF it.item_type = 'bolsa' AND it.product_id IS NOT NULL THEN
      UPDATE public.products
         SET stock = GREATEST(stock - it.quantity, 0)
       WHERE id = it.product_id AND availability = 'pronta-entrega';
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_order_payment(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_order_payment(uuid, text) TO service_role;

CREATE OR REPLACE FUNCTION public.cancel_order_payment(_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  o public.orders;
  it record;
BEGIN
  SELECT * INTO o FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF o.id IS NULL THEN RAISE EXCEPTION 'Pedido não encontrado'; END IF;

  IF o.payment_status = 'pago' THEN
    FOR it IN SELECT * FROM public.order_items WHERE order_id = _order_id LOOP
      IF it.item_type = 'bolsa' AND it.product_id IS NOT NULL THEN
        UPDATE public.products SET stock = stock + it.quantity
         WHERE id = it.product_id AND availability = 'pronta-entrega';
      ELSIF it.item_type = 'curso' AND it.course_id IS NOT NULL THEN
        UPDATE public.course_access SET revoked = true
         WHERE user_id = o.user_id AND course_id = it.course_id
           AND note = 'Liberado pelo pedido ' || _order_id;
      END IF;
    END LOOP;
  END IF;

  UPDATE public.orders
     SET payment_status = 'cancelado', fulfillment_status = 'cancelado'
   WHERE id = _order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_order_payment(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_order_payment(uuid) TO service_role;