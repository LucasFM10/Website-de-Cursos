-- Restrict SECURITY DEFINER functions to the roles that actually need them.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_course_access(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_course_access(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.touch_updated_at() TO service_role;

-- Split public-read policies so anonymous visitors never evaluate has_role().
DROP POLICY "courses_public_read" ON public.courses;
CREATE POLICY "courses_anon_read" ON public.courses FOR SELECT TO anon USING (published);
CREATE POLICY "courses_auth_read" ON public.courses FOR SELECT TO authenticated
  USING (published OR public.has_role(auth.uid(), 'admin'));

DROP POLICY "modules_public_read" ON public.course_modules;
CREATE POLICY "modules_anon_read" ON public.course_modules FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.published));
CREATE POLICY "modules_auth_read" ON public.course_modules FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND (c.published OR public.has_role(auth.uid(), 'admin'))));

DROP POLICY "lessons_public_read" ON public.lessons;
CREATE POLICY "lessons_anon_read" ON public.lessons FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.course_modules m JOIN public.courses c ON c.id = m.course_id WHERE m.id = module_id AND c.published));
CREATE POLICY "lessons_auth_read" ON public.lessons FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.course_modules m JOIN public.courses c ON c.id = m.course_id WHERE m.id = module_id AND (c.published OR public.has_role(auth.uid(), 'admin'))));

DROP POLICY "products_public_read" ON public.products;
CREATE POLICY "products_anon_read" ON public.products FOR SELECT TO anon USING (published);
CREATE POLICY "products_auth_read" ON public.products FOR SELECT TO authenticated
  USING (published OR public.has_role(auth.uid(), 'admin'));