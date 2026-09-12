"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createDream(formData: FormData) {
  const description = String(formData.get("description") ?? "").trim();
  const targetDate = String(formData.get("targetDate") ?? "").trim() || null;

  if (!description) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("dreams")
    .insert({ user_id: user.id, description, target_date: targetDate });

  revalidatePath("/sonhos");
}

export async function updateDream(id: string, formData: FormData) {
  const description = String(formData.get("description") ?? "").trim();
  const targetDate = String(formData.get("targetDate") ?? "").trim() || null;

  if (!description) return;

  const supabase = await createClient();
  await supabase
    .from("dreams")
    .update({ description, target_date: targetDate })
    .eq("id", id);

  revalidatePath("/sonhos");
  revalidatePath(`/sonhos/${id}`);
}

export async function toggleDreamRealized(id: string, realized: boolean) {
  const supabase = await createClient();
  await supabase
    .from("dreams")
    .update({ realized_at: realized ? new Date().toISOString() : null })
    .eq("id", id);

  revalidatePath("/sonhos");
  revalidatePath(`/sonhos/${id}`);
}

export async function deleteDream(id: string) {
  const supabase = await createClient();
  await supabase.from("dreams").delete().eq("id", id);
  revalidatePath("/sonhos");
}
