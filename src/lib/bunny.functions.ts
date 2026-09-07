import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---- Bunny Stream ----------------------------------------------------------
// Library ID + API key ficam apenas no servidor. O navegador recebe só uma
// assinatura temporária (TUS) para enviar o arquivo direto para o Bunny, e uma
// URL de reprodução assinada com validade curta.

function bunnyEnv() {
  const libraryId = process.env["BUNNY_STREAM_LIBRARY_ID"];
  const apiKey = process.env["BUNNY_STREAM_API_KEY"];
  if (!libraryId || !apiKey) {
    throw new Error(
      "Configuração do Bunny Stream ausente. Salve o número da biblioteca e a chave da API.",
    );
  }
  return { libraryId, apiKey };
}

async function sha256Hex(input: string) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function assertAdmin(supabase: {
  rpc: (fn: "has_role", args: { _user_id: string; _role: "admin" }) => PromiseLike<{ data: unknown }>;
}, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (data !== true) throw new Error("Apenas a administradora pode fazer isso.");
}

/** Cria o vídeo no Bunny e devolve a assinatura de envio (TUS) para o navegador. */
export const createVideoUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { lessonId: string; title: string }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { libraryId, apiKey } = bunnyEnv();

    const created = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
      method: "POST",
      headers: { AccessKey: apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ title: data.title }),
    });
    if (!created.ok) {
      throw new Error(`Bunny recusou a criação do vídeo (${created.status}).`);
    }
    const video = (await created.json()) as { guid: string };

    const expiration = Math.floor(Date.now() / 1000) + 3 * 60 * 60;
    const signature = await sha256Hex(`${libraryId}${apiKey}${expiration}${video.guid}`);

    const { error } = await context.supabase
      .from("lessons")
      .update({ bunny_video_id: video.guid, video_status: "enviando" })
      .eq("id", data.lessonId);
    if (error) throw new Error(error.message);

    return { libraryId, videoId: video.guid, expiration, signature };
  });

const STATUS_LABEL: Record<number, string> = {
  0: "na fila",
  1: "na fila",
  2: "processando",
  3: "processando",
  4: "pronto",
  5: "falhou",
  6: "processando",
};

/** Consulta o Bunny e atualiza a situação do vídeo da aula. */
export const refreshVideoStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { lessonId: string }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { libraryId, apiKey } = bunnyEnv();

    const { data: lesson, error } = await context.supabase
      .from("lessons")
      .select("id, bunny_video_id")
      .eq("id", data.lessonId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!lesson?.bunny_video_id) return { status: "sem-video", durationMinutes: 0 };

    const res = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos/${lesson.bunny_video_id}`,
      { headers: { AccessKey: apiKey } },
    );
    if (!res.ok) throw new Error(`Bunny não respondeu (${res.status}).`);
    const info = (await res.json()) as { status: number; length?: number };
    const status = STATUS_LABEL[info.status] ?? "processando";
    const durationMinutes = info.length ? Math.max(1, Math.round(info.length / 60)) : 0;

    await context.supabase
      .from("lessons")
      .update({
        video_status: status,
        ...(durationMinutes ? { duration_minutes: durationMinutes } : {}),
      })
      .eq("id", data.lessonId);

    return { status, durationMinutes };
  });

async function signedEmbed(libraryId: string, videoId: string) {
  const tokenKey = process.env["BUNNY_STREAM_TOKEN_KEY"];
  const expires = Math.floor(Date.now() / 1000) + 4 * 60 * 60;
  if (!tokenKey) {
    // Biblioteca sem autenticação por token: embed simples.
    return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&preload=false`;
  }
  const token = await sha256Hex(`${tokenKey}${videoId}${expires}`);
  return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${token}&expires=${expires}&autoplay=false&preload=false`;
}

/** Aula liberada para quem tem acesso vigente ao curso (ou para a administradora). */
export const getLessonPlayback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { lessonId: string }) => data)
  .handler(async ({ data, context }) => {
    const { libraryId } = bunnyEnv();

    const { data: lesson, error } = await context.supabase
      .from("lessons")
      .select(
        "id, title, description, bunny_video_id, video_status, free_preview, course_modules(course_id, courses(id, slug, title))",
      )
      .eq("id", data.lessonId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!lesson) throw new Error("Aula não encontrada.");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parent = (lesson as any).course_modules;
    const course = parent?.courses;
    if (!course) throw new Error("Aula sem curso vinculado.");

    let allowed = lesson.free_preview === true;
    if (!allowed) {
      const { data: ok } = await context.supabase.rpc("has_course_access", {
        _user_id: context.userId,
        _course_id: course.id,
      });
      allowed = ok === true;
    }

    if (!allowed) {
      return {
        allowed: false as const,
        course: { slug: course.slug, title: course.title },
        lesson: { title: lesson.title, description: lesson.description ?? "" },
        embedUrl: null,
      };
    }

    if (!lesson.bunny_video_id) {
      return {
        allowed: true as const,
        course: { slug: course.slug, title: course.title },
        lesson: { title: lesson.title, description: lesson.description ?? "" },
        embedUrl: null,
      };
    }

    return {
      allowed: true as const,
      course: { slug: course.slug, title: course.title },
      lesson: { title: lesson.title, description: lesson.description ?? "" },
      embedUrl: await signedEmbed(libraryId, lesson.bunny_video_id),
    };
  });
