"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayInTimeZone } from "@/lib/utils/dates";

const MAX_TITLE = 120;
const MAX_DESCRIPTION = 1000;
const MAX_STEP_TITLE = 200;

async function getUserClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function revalidateProject(id?: string) {
  revalidatePath("/acao");
  revalidatePath("/progresso");
  if (id) revalidatePath(`/acao/projetos/${id}`);
}

export async function createProject(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim().slice(0, MAX_TITLE);
  if (!title) return;

  const { supabase, user } = await getUserClient();
  if (!user) return;

  const { data: project } = await supabase
    .from("projects")
    .insert({ user_id: user.id, title })
    .select("id")
    .single();
  if (!project) return;

  revalidateProject();
  redirect({ href: `/acao/projetos/${project.id}`, locale: await getLocale() });
}

export async function updateProject(id: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim().slice(0, MAX_TITLE);
  if (!title) return;
  const description = String(formData.get("description") ?? "").trim().slice(0, MAX_DESCRIPTION);
  const targetDate = String(formData.get("targetDate") ?? "").trim();
  const dreamId = String(formData.get("dreamId") ?? "").trim();

  const { supabase, user } = await getUserClient();
  if (!user) return;

  await supabase
    .from("projects")
    .update({
      title,
      description,
      target_date: /^\d{4}-\d{2}-\d{2}$/.test(targetDate) ? targetDate : null,
      dream_id: dreamId || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidateProject(id);
}

export async function toggleProjectCompleted(id: string, completed: boolean) {
  const { supabase, user } = await getUserClient();
  if (!user) return;

  await supabase
    .from("projects")
    .update({
      completed_at: completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidateProject(id);
}

export async function deleteProject(id: string) {
  const { supabase, user } = await getUserClient();
  if (!user) return;

  await supabase.from("projects").delete().eq("id", id);

  revalidateProject();
  redirect({ href: "/acao", locale: await getLocale() });
}

export async function addStep(projectId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim().slice(0, MAX_STEP_TITLE);
  if (!title) return;

  const { supabase, user } = await getUserClient();
  if (!user) return;

  const { data: last } = await supabase
    .from("project_steps")
    .select("position")
    .eq("project_id", projectId)
    .order("position", { ascending: false })
    .limit(1);

  await supabase.from("project_steps").insert({
    project_id: projectId,
    user_id: user.id,
    title,
    position: (last?.[0]?.position ?? -1) + 1,
  });

  revalidateProject(projectId);
}

async function projectIdOfStep(
  supabase: Awaited<ReturnType<typeof createClient>>,
  stepId: string,
) {
  const { data } = await supabase
    .from("project_steps")
    .select("project_id")
    .eq("id", stepId)
    .single();
  return data?.project_id ?? null;
}

export async function toggleStep(stepId: string, done: boolean) {
  const { supabase, user } = await getUserClient();
  if (!user) return;

  const projectId = await projectIdOfStep(supabase, stepId);
  await supabase
    .from("project_steps")
    .update({ done_at: done ? new Date().toISOString() : null })
    .eq("id", stepId);

  revalidateProject(projectId ?? undefined);
}

export async function updateStep(stepId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim().slice(0, MAX_STEP_TITLE);
  if (!title) return;

  const { supabase, user } = await getUserClient();
  if (!user) return;

  const projectId = await projectIdOfStep(supabase, stepId);
  await supabase.from("project_steps").update({ title }).eq("id", stepId);

  revalidateProject(projectId ?? undefined);
}

export async function deleteStep(stepId: string) {
  const { supabase, user } = await getUserClient();
  if (!user) return;

  const projectId = await projectIdOfStep(supabase, stepId);
  await supabase.from("project_steps").delete().eq("id", stepId);

  revalidateProject(projectId ?? undefined);
}

export async function moveStep(stepId: string, direction: "up" | "down") {
  const { supabase, user } = await getUserClient();
  if (!user) return;

  const projectId = await projectIdOfStep(supabase, stepId);
  if (!projectId) return;

  const { data: steps } = await supabase
    .from("project_steps")
    .select("id, position")
    .eq("project_id", projectId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (!steps) return;

  const from = steps.findIndex((s) => s.id === stepId);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from < 0 || to < 0 || to >= steps.length) return;

  // Renumera toda a lista (0..n-1): resolve também posições empatadas.
  const reordered = [...steps];
  [reordered[from], reordered[to]] = [reordered[to], reordered[from]];
  await Promise.all(
    reordered.map((step, index) =>
      step.position === index
        ? null
        : supabase.from("project_steps").update({ position: index }).eq("id", step.id),
    ),
  );

  revalidateProject(projectId);
}

/** Cria uma ação em "Hoje" a partir de um passo do projeto. Retorna se deu certo. */
export async function sendStepToToday(stepId: string): Promise<boolean> {
  const { supabase, user } = await getUserClient();
  if (!user) return false;

  const { data: step } = await supabase
    .from("project_steps")
    .select("title, project_id")
    .eq("id", stepId)
    .single();
  if (!step) return false;

  const [{ data: project }, { data: profile }] = await Promise.all([
    supabase.from("projects").select("title").eq("id", step.project_id).single(),
    supabase.from("profiles").select("timezone").eq("id", user.id).single(),
  ]);

  const { error } = await supabase.from("daily_actions").insert({
    user_id: user.id,
    title: `${project?.title ?? ""}: ${step.title}`.replace(/^: /, "").slice(0, 200),
    due_date: todayInTimeZone(profile?.timezone ?? "America/Sao_Paulo"),
  });
  if (error) return false;

  revalidatePath("/acao");
  revalidatePath("/hoje");
  return true;
}
