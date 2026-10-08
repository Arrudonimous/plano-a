"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getAdmin } from "@/lib/admin";
import { isValidSlug, readLocalized, readLocalizedSteps } from "@/lib/content/form";
import { parseMedia } from "@/lib/content/media";

const KINDS = ["program", "journey", "meditation"];
const ACCESS = ["free", "premium"];

function revalidateContent(programId?: string) {
  revalidatePath("/admin");
  if (programId) revalidatePath(`/admin/programas/${programId}`);
  revalidatePath("/conteudo/[slug]", "page");
  for (const path of ["/jornadas", "/programas", "/mentalizacoes"]) revalidatePath(path);
}

export async function createProgram(formData: FormData) {
  const admin = await getAdmin();
  if (!admin) return;

  const slug = String(formData.get("slug") ?? "").trim();
  const kind = String(formData.get("kind") ?? "");
  const title = readLocalized(formData, "title", 120);
  if (!isValidSlug(slug) || !KINDS.includes(kind) || Object.keys(title).length === 0) return;

  const { data } = await admin.supabase
    .from("programs")
    .insert({ slug, kind, title, published: false })
    .select("id")
    .single();
  if (!data) return;

  revalidateContent();
  redirect({ href: `/admin/programas/${data.id}`, locale: await getLocale() });
}

export async function updateProgram(id: string, formData: FormData) {
  const admin = await getAdmin();
  if (!admin) return;

  const slug = String(formData.get("slug") ?? "").trim();
  const kind = String(formData.get("kind") ?? "");
  const access = String(formData.get("access") ?? "");
  const title = readLocalized(formData, "title", 120);
  const position = Number(formData.get("position") ?? 0);
  if (
    !isValidSlug(slug) ||
    !KINDS.includes(kind) ||
    !ACCESS.includes(access) ||
    Object.keys(title).length === 0 ||
    !Number.isInteger(position)
  ) {
    return;
  }

  await admin.supabase
    .from("programs")
    .update({
      slug,
      kind,
      access,
      title,
      summary: readLocalized(formData, "summary", 600),
      published: formData.get("published") === "on",
      position,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidateContent(id);
}

export async function deleteProgram(id: string) {
  const admin = await getAdmin();
  if (!admin) return;

  await admin.supabase.from("programs").delete().eq("id", id);
  revalidateContent();
  redirect({ href: "/admin", locale: await getLocale() });
}

/** Cria (lessonId = null) ou atualiza uma aula. */
export async function saveLesson(programId: string, lessonId: string | null, formData: FormData) {
  const admin = await getAdmin();
  if (!admin) return;

  const title = readLocalized(formData, "title", 160);
  const rawMedia = String(formData.get("media_url") ?? "").trim();
  const duration = Number(formData.get("duration") || 0);
  if (Object.keys(title).length === 0) return;
  if (rawMedia && !parseMedia(rawMedia)) return;

  const fields = {
    title,
    body: readLocalized(formData, "body"),
    media_url: rawMedia || null,
    duration_minutes: Number.isInteger(duration) && duration >= 1 && duration <= 600 ? duration : null,
    steps: readLocalizedSteps(formData, "steps"),
  };

  if (lessonId) {
    await admin.supabase.from("program_lessons").update(fields).eq("id", lessonId);
  } else {
    const { data: last } = await admin.supabase
      .from("program_lessons")
      .select("position")
      .eq("program_id", programId)
      .order("position", { ascending: false })
      .limit(1);
    await admin.supabase
      .from("program_lessons")
      .insert({ ...fields, program_id: programId, position: (last?.[0]?.position ?? -1) + 1 });
  }

  revalidateContent(programId);
}

export async function deleteLesson(programId: string, lessonId: string) {
  const admin = await getAdmin();
  if (!admin) return;
  await admin.supabase.from("program_lessons").delete().eq("id", lessonId);
  revalidateContent(programId);
}

export async function moveLesson(programId: string, lessonId: string, direction: "up" | "down") {
  const admin = await getAdmin();
  if (!admin) return;

  const { data: lessons } = await admin.supabase
    .from("program_lessons")
    .select("id, position")
    .eq("program_id", programId)
    .order("position")
    .order("created_at");
  if (!lessons) return;

  const from = lessons.findIndex((l) => l.id === lessonId);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from < 0 || to < 0 || to >= lessons.length) return;

  const reordered = [...lessons];
  [reordered[from], reordered[to]] = [reordered[to], reordered[from]];
  await Promise.all(
    reordered.map((lesson, index) =>
      lesson.position === index
        ? null
        : admin.supabase.from("program_lessons").update({ position: index }).eq("id", lesson.id),
    ),
  );

  revalidateContent(programId);
}
