-- ===== Roles =====
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- New signups get a profile; the very first account becomes the administrator.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  ON CONFLICT (id) DO NOTHING;

  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===== Catalog =====
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  short_description text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  level text NOT NULL DEFAULT 'Iniciante',
  price_cents integer NOT NULL DEFAULT 0,
  access_duration_days integer NOT NULL DEFAULT 180,
  image_key text,
  image_alt text NOT NULL DEFAULT '',
  learning_outcomes text[] NOT NULL DEFAULT '{}',
  materials text[] NOT NULL DEFAULT '{}',
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.courses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "courses_public_read" ON public.courses FOR SELECT TO anon, authenticated
  USING (published OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "courses_admin_write" ON public.courses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER courses_touch BEFORE UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  position integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.course_modules TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_modules TO authenticated;
GRANT ALL ON public.course_modules TO service_role;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modules_public_read" ON public.course_modules FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND (c.published OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "modules_admin_write" ON public.course_modules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  position integer NOT NULL DEFAULT 1,
  duration_minutes integer NOT NULL DEFAULT 0,
  bunny_video_id text,
  video_status text NOT NULL DEFAULT 'sem-video',
  free_preview boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lessons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lessons_public_read" ON public.lessons FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.course_modules m
    JOIN public.courses c ON c.id = m.course_id
    WHERE m.id = module_id AND (c.published OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "lessons_admin_write" ON public.lessons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER lessons_touch BEFORE UPDATE ON public.lessons
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  short_description text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  price_cents integer NOT NULL DEFAULT 0,
  image_key text,
  image_alt text NOT NULL DEFAULT '',
  availability text NOT NULL DEFAULT 'pronta-entrega',
  stock integer NOT NULL DEFAULT 0,
  production_days integer,
  materials text[] NOT NULL DEFAULT '{}',
  dimensions text NOT NULL DEFAULT '',
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_public_read" ON public.products FOR SELECT TO anon, authenticated
  USING (published OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "products_admin_write" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER products_touch BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===== Temporary course access =====
CREATE TABLE public.course_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked boolean NOT NULL DEFAULT false,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_access TO authenticated;
GRANT ALL ON public.course_access TO service_role;
ALTER TABLE public.course_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "access_select_own" ON public.course_access FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "access_admin_write" ON public.course_access FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER course_access_touch BEFORE UPDATE ON public.course_access
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.has_course_access(_user_id uuid, _course_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.course_access
    WHERE user_id = _user_id AND course_id = _course_id
      AND revoked = false AND starts_at <= now() AND expires_at > now()
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'
  );
$$;

-- ===== Example content (fictional, replace later) =====
INSERT INTO public.courses (slug, title, short_description, description, level, price_cents, access_duration_days, image_key, image_alt, learning_outcomes, materials, featured, sort_order) VALUES
('bolsa-bucket-em-fio-de-malha', 'Bolsa Bucket em Fio de Malha',
 'Do anel mágico ao acabamento: a bucket de fio de malha em cru, ponto por ponto.',
 'Um curso completo para quem quer dominar a base circular e a estrutura firme da bolsa bucket. Você acompanha cada etapa em vídeo, com câmera sobre as mãos, e recebe o gráfico em PDF para imprimir.',
 'Iniciante', 24700, 180, 'curso-bolsa-bucket', 'Bolsa bucket de crochê em fio de malha cru sobre mesa de linho',
 ARRAY['Montar base circular sem deformar o fundo da bolsa','Manter tensão constante no fio de malha','Fazer alças em cordão trançado resistente','Finalizar com forro e cordão de fechamento'],
 ARRAY['Gráfico da bolsa em PDF','Lista de materiais e fornecedores'], true, 1),
('tote-bordo-com-alcas-de-couro', 'Tote Bordô com Alças de Couro',
 'Estrutura firme, ponto baixo alinhado e aplicação de alças de couro com rebite.',
 'A tote é a bolsa de todos os dias. Neste curso você aprende a trabalhar o ponto baixo em fileiras alinhadas, dar estrutura ao corpo da peça e aplicar alças de couro com acabamento profissional.',
 'Intermediário', 32700, 365, 'curso-tote-bordo', 'Bolsa tote de crochê bordô com alças de couro',
 ARRAY['Trabalhar fileiras longas sem torcer a peça','Dar estrutura com entretela e base rígida','Aplicar alças de couro com rebites','Costurar bolso interno com zíper'],
 ARRAY['Gráfico em PDF','Molde do bolso interno','Guia de rebites'], true, 2),
('clutch-caramelo-em-ponto-fechado', 'Clutch Caramelo em Ponto Fechado',
 'Uma peça de festa em fio fino, com textura fechada e fecho de metal embutido.',
 'Um projeto pequeno e refinado para treinar precisão. O ponto fechado em fio fino exige constância, e o resultado é uma clutch elegante, com fecho de metal costurado por dentro.',
 'Avançado', 28700, 180, 'curso-clutch-caramelo', 'Clutch de crochê caramelo em ponto fechado sobre pano de linho',
 ARRAY['Trabalhar fio fino com agulha pequena','Criar textura fechada e uniforme','Costurar fecho de metal por dentro da peça','Blocar a peça para manter o formato'],
 ARRAY['Gráfico em PDF','Guia de blocagem'], true, 3);

INSERT INTO public.course_modules (course_id, title, position)
SELECT c.id, m.title, m.position FROM public.courses c
JOIN (VALUES
  ('bolsa-bucket-em-fio-de-malha','Preparando o trabalho',1),
  ('bolsa-bucket-em-fio-de-malha','Corpo da bolsa',2),
  ('bolsa-bucket-em-fio-de-malha','Acabamento',3),
  ('tote-bordo-com-alcas-de-couro','Fundamentos da tote',1),
  ('tote-bordo-com-alcas-de-couro','Corpo e estrutura',2),
  ('tote-bordo-com-alcas-de-couro','Couro e forro',3),
  ('clutch-caramelo-em-ponto-fechado','Preparação',1),
  ('clutch-caramelo-em-ponto-fechado','Construção',2),
  ('clutch-caramelo-em-ponto-fechado','Finalização',3)
) AS m(slug, title, position) ON m.slug = c.slug;

INSERT INTO public.lessons (module_id, title, position, duration_minutes, free_preview)
SELECT mo.id, l.title, l.position, l.minutes, l.free FROM public.course_modules mo
JOIN public.courses c ON c.id = mo.course_id
JOIN (VALUES
  ('bolsa-bucket-em-fio-de-malha',1,'Materiais e escolha do fio',1,12,true),
  ('bolsa-bucket-em-fio-de-malha',1,'Amostra e tensão do ponto',2,18,false),
  ('bolsa-bucket-em-fio-de-malha',2,'Base circular passo a passo',1,32,false),
  ('bolsa-bucket-em-fio-de-malha',2,'Subindo as laterais',2,27,false),
  ('bolsa-bucket-em-fio-de-malha',2,'Marcação e ajuste de altura',3,15,false),
  ('bolsa-bucket-em-fio-de-malha',3,'Alças em cordão trançado',1,22,false),
  ('bolsa-bucket-em-fio-de-malha',3,'Forro e fechamento',2,28,false),
  ('tote-bordo-com-alcas-de-couro',1,'Leitura do gráfico',1,14,true),
  ('tote-bordo-com-alcas-de-couro',1,'Base retangular firme',2,26,false),
  ('tote-bordo-com-alcas-de-couro',2,'Fileiras alinhadas em ponto baixo',1,34,false),
  ('tote-bordo-com-alcas-de-couro',2,'Entretela e reforço da base',2,21,false),
  ('tote-bordo-com-alcas-de-couro',3,'Corte e marcação das alças',1,19,false),
  ('tote-bordo-com-alcas-de-couro',3,'Rebites sem danificar o crochê',2,24,false),
  ('tote-bordo-com-alcas-de-couro',3,'Forro com bolso e zíper',3,36,false),
  ('clutch-caramelo-em-ponto-fechado',1,'Fio fino, agulha e tensão',1,16,true),
  ('clutch-caramelo-em-ponto-fechado',1,'Amostra de ponto fechado',2,20,false),
  ('clutch-caramelo-em-ponto-fechado',2,'Corpo da clutch em uma peça',1,38,false),
  ('clutch-caramelo-em-ponto-fechado',2,'Aba e dobra estruturada',2,25,false),
  ('clutch-caramelo-em-ponto-fechado',3,'Costura do fecho de metal',1,29,false),
  ('clutch-caramelo-em-ponto-fechado',3,'Blocagem e cuidados',2,17,false)
) AS l(slug, mod_pos, title, position, minutes, free)
  ON l.slug = c.slug AND l.mod_pos = mo.position;

INSERT INTO public.products (slug, name, short_description, description, price_cents, image_key, image_alt, availability, stock, production_days, materials, dimensions, featured, sort_order) VALUES
('bolsa-redonda-de-palha','Bolsa Redonda de Palha','Ráfia natural em espiral com alça de madeira torneada.',
 'Tecida em ráfia natural em espiral contínua, com alça de madeira torneada e forro de algodão cru. Leve, firme e feita para o verão.',
 39000,'bolsa-raffia-redonda','Bolsa redonda de crochê em ráfia natural com alça de madeira','pronta-entrega',3,NULL,
 ARRAY['Ráfia natural','Alça de madeira','Forro de algodão'],'24 cm de diâmetro × 8 cm de profundidade',true,1),
('transversal-oliva','Transversal Oliva','Fio de malha verde-oliva com alça trançada ajustável.',
 'Bolsa transversal de uso diário em fio de malha verde-oliva, com textura em ponto puff e alça trançada ajustável em argolas douradas.',
 34000,'bolsa-crossbody-oliva','Bolsa transversal de crochê verde-oliva com alça trançada','pronta-entrega',2,NULL,
 ARRAY['Fio de malha de algodão','Argolas metálicas','Forro de algodão'],'20 × 22 × 9 cm',true,2),
('tote-de-praia-terracota','Tote de Praia Terracota','Tote grande em algodão cru com faixa terracota.',
 'A maior peça do ateliê: tote de praia em algodão cru com faixa terracota, base reforçada e alças largas para carregar o dia inteiro. Feita sob encomenda.',
 46000,'bolsa-tote-praia','Bolsa tote grande de crochê em algodão cru com faixa terracota','encomenda',0,15,
 ARRAY['Algodão cru','Fio terracota','Base reforçada'],'40 × 42 × 14 cm',true,3),
('mini-bolsa-bordo','Mini Bolsa Bordô','Peça pequena em fio bordô com fecho dourado.',
 'Mini bolsa de festa em fio de malha bordô, ponto puff fechado e fecho dourado escovado. Cabe celular, cartão e batom.',
 27000,'bolsa-mini-bordo','Mini bolsa de crochê bordô com fecho dourado','pronta-entrega',5,NULL,
 ARRAY['Fio de malha de algodão','Fecho dourado escovado'],'16 × 13 × 7 cm',false,4);