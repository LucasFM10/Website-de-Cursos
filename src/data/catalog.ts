// Tipos e formatadores do catálogo. Os dados vivem no banco do Lovable Cloud
// e são lidos pelas funções de servidor em src/lib/catalog.functions.ts.

export { images, imageByKey, imageKeys, resolveImage } from "./images";

export type CourseLevel = "Iniciante" | "Intermediário" | "Avançado";

export const courseLevels: CourseLevel[] = ["Iniciante", "Intermediário", "Avançado"];

export interface Lesson {
  id: string;
  title: string;
  description: string;
  position: number;
  durationMinutes: number;
  freePreview: boolean;
  hasVideo: boolean;
  videoStatus: string;
}

export interface CourseModule {
  id: string;
  title: string;
  position: number;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  level: string;
  priceCents: number;
  accessDurationDays: number;
  imageKey: string | null;
  imageAlt: string;
  learningOutcomes: string[];
  materials: string[];
  featured: boolean;
  published: boolean;
  modules: CourseModule[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  priceCents: number;
  imageKey: string | null;
  imageAlt: string;
  availability: string;
  stock: number;
  productionDays: number | null;
  materials: string[];
  dimensions: string;
  featured: boolean;
  published: boolean;
}

export const formatPrice = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

export const totalLessons = (course: Course) =>
  course.modules.reduce((sum, m) => sum + m.lessons.length, 0);

export const totalMinutes = (course: Course) =>
  course.modules.reduce(
    (sum, m) => sum + m.lessons.reduce((s, l) => s + l.durationMinutes, 0),
    0,
  );

export const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
};

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
