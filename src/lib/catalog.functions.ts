import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { Course, CourseModule, Product } from "@/data/catalog";

function publicClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const COURSE_SELECT =
  "id, slug, title, short_description, description, level, price_cents, access_duration_days, image_key, image_alt, learning_outcomes, materials, featured, published, sort_order, course_modules(id, title, position, lessons(id, title, description, position, duration_minutes, free_preview, bunny_video_id, video_status))";

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapCourse(row: any): Course {
  const modules: CourseModule[] = (row.course_modules ?? [])
    .slice()
    .sort((a: any, b: any) => a.position - b.position)
    .map((m: any) => ({
      id: m.id,
      title: m.title,
      position: m.position,
      lessons: (m.lessons ?? [])
        .slice()
        .sort((a: any, b: any) => a.position - b.position)
        .map((l: any) => ({
          id: l.id,
          title: l.title,
          description: l.description ?? "",
          position: l.position,
          durationMinutes: l.duration_minutes,
          freePreview: l.free_preview,
          hasVideo: Boolean(l.bunny_video_id),
          videoStatus: l.video_status,
        })),
    }));

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description,
    description: row.description,
    level: row.level,
    priceCents: row.price_cents,
    accessDurationDays: row.access_duration_days,
    imageKey: row.image_key,
    imageAlt: row.image_alt,
    learningOutcomes: row.learning_outcomes ?? [],
    materials: row.materials ?? [],
    featured: row.featured,
    published: row.published,
    modules,
  };
}

function mapProduct(row: any): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    description: row.description,
    priceCents: row.price_cents,
    imageKey: row.image_key,
    imageAlt: row.image_alt,
    availability: row.availability,
    stock: row.stock,
    productionDays: row.production_days,
    materials: row.materials ?? [],
    dimensions: row.dimensions,
    featured: row.featured,
    published: row.published,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export const listCourses = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("courses")
    .select(COURSE_SELECT)
    .eq("published", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapCourse);
});

export const getCourseBySlug = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const { data: row, error } = await publicClient()
      .from("courses")
      .select(COURSE_SELECT)
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? mapCourse(row) : null;
  });

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("products")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapProduct);
});

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const { data: row, error } = await publicClient()
      .from("products")
      .select("*")
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? mapProduct(row) : null;
  });
