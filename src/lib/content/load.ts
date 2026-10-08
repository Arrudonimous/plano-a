import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { parseMedia, type Media } from "@/lib/content/media";
import type { Database } from "@/lib/types/database.types";

type Supabase = Awaited<ReturnType<typeof createClient>>;
export type Program = Database["public"]["Tables"]["programs"]["Row"];
export type Lesson = Database["public"]["Tables"]["program_lessons"]["Row"];
export type ProgramKind = "program" | "journey" | "meditation";

export interface ProgramCard {
  program: Program;
  totalLessons: number;
  doneLessons: number;
  enrolled: boolean;
}

export async function loadProgramCards(
  supabase: Supabase,
  userId: string,
  kind: ProgramKind,
): Promise<ProgramCard[]> {
  const { data: programs } = await supabase
    .from("programs")
    .select("*")
    .eq("kind", kind)
    .eq("published", true)
    .order("position")
    .order("created_at");
  if (!programs?.length) return [];

  const ids = programs.map((p) => p.id);
  const [{ data: lessons }, { data: progress }, { data: enrollments }] = await Promise.all([
    supabase.from("program_lessons").select("id, program_id").in("program_id", ids),
    supabase.from("lesson_progress").select("lesson_id").eq("user_id", userId),
    supabase.from("program_enrollments").select("program_id").eq("user_id", userId).in("program_id", ids),
  ]);

  const doneIds = new Set((progress ?? []).map((p) => p.lesson_id));
  const enrolled = new Set((enrollments ?? []).map((e) => e.program_id));

  return programs.map((program) => {
    const own = (lessons ?? []).filter((l) => l.program_id === program.id);
    return {
      program,
      totalLessons: own.length,
      doneLessons: own.filter((l) => doneIds.has(l.id)).length,
      enrolled: enrolled.has(program.id),
    };
  });
}

export interface LessonView extends Lesson {
  done: boolean;
  media: Media;
  /** URL pronta para tocar (assinada quando a mídia está no Storage). */
  playUrl: string | null;
}

/** Aulas já filtradas pela RLS (premium só para assinantes); assina mídias do Storage. */
export async function loadLessons(
  supabase: Supabase,
  userId: string,
  programId: string,
): Promise<LessonView[]> {
  const [{ data: lessons }, { data: progress }] = await Promise.all([
    supabase
      .from("program_lessons")
      .select("*")
      .eq("program_id", programId)
      .order("position")
      .order("created_at"),
    supabase.from("lesson_progress").select("lesson_id").eq("user_id", userId),
  ]);
  const doneIds = new Set((progress ?? []).map((p) => p.lesson_id));

  return Promise.all(
    (lessons ?? []).map(async (lesson) => {
      const media = parseMedia(lesson.media_url);
      let playUrl: string | null = null;
      if (media?.type === "file") playUrl = media.url;
      if (media?.type === "storage") {
        try {
          const { data } = await createAdminClient()
            .storage.from("content")
            .createSignedUrl(media.path, 60 * 60);
          playUrl = data?.signedUrl ?? null;
        } catch {
          playUrl = null;
        }
      }
      return { ...lesson, done: doneIds.has(lesson.id), media, playUrl };
    }),
  );
}
