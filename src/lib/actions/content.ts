"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { track } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/server";
import { localized, localizedList } from "@/lib/content/localized";

async function getUserClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function startProgram(programId: string) {
  const { supabase, user } = await getUserClient();
  if (!user) return;

  await supabase
    .from("program_enrollments")
    .upsert({ user_id: user.id, program_id: programId }, { onConflict: "user_id,program_id", ignoreDuplicates: true });

  await track("program_started");
  revalidatePath("/conteudo/[slug]", "page");
}

export async function toggleLesson(lessonId: string, done: boolean) {
  const { supabase, user } = await getUserClient();
  if (!user) return;

  if (done) {
    await supabase
      .from("lesson_progress")
      .upsert({ user_id: user.id, lesson_id: lessonId }, { onConflict: "user_id,lesson_id", ignoreDuplicates: true });
    await track("lesson_done");
  } else {
    await supabase.from("lesson_progress").delete().eq("user_id", user.id).eq("lesson_id", lessonId);
  }

  revalidatePath("/conteudo/[slug]", "page");
  revalidatePath("/jornadas");
  revalidatePath("/programas");
  revalidatePath("/mentalizacoes");
}

/** Cria (uma vez) um projeto com os passos práticos de todas as aulas da jornada. */
export async function createJourneyProject(programId: string) {
  const { supabase, user } = await getUserClient();
  if (!user) return;
  const locale = await getLocale();

  const { data: enrollment } = await supabase
    .from("program_enrollments")
    .select("project_id")
    .eq("user_id", user.id)
    .eq("program_id", programId)
    .maybeSingle();

  if (enrollment?.project_id) {
    redirect({ href: `/acao/projetos/${enrollment.project_id}`, locale });
    return;
  }

  const [{ data: program }, { data: lessons }] = await Promise.all([
    supabase.from("programs").select("title, summary").eq("id", programId).single(),
    supabase.from("program_lessons").select("steps, position").eq("program_id", programId).order("position"),
  ]);
  if (!program) return;

  const { data: project } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      title: localized(program.title, locale).slice(0, 120) || "Jornada",
      description: localized(program.summary, locale).slice(0, 1000),
    })
    .select("id")
    .single();
  if (!project) return;

  const steps = (lessons ?? [])
    .flatMap((lesson) => localizedList(lesson.steps, locale))
    .map((title, position) => ({
      project_id: project.id,
      user_id: user.id,
      title: title.slice(0, 200),
      position,
    }));
  if (steps.length > 0) await supabase.from("project_steps").insert(steps);

  await supabase
    .from("program_enrollments")
    .upsert({ user_id: user.id, program_id: programId, project_id: project.id }, { onConflict: "user_id,program_id" });

  await track("journey_project_created");
  revalidatePath("/acao");
  redirect({ href: `/acao/projetos/${project.id}`, locale });
}
