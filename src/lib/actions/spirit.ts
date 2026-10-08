"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayInTimeZone } from "@/lib/utils/dates";

export const SPIRIT_KINDS = ["reflection", "practice", "intention", "inspiration"] as const;
const MAX_TEXT = 2000;
const MAX_LABEL = 60;

async function getUserClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function addSpiritEntry(formData: FormData) {
  const text = String(formData.get("text") ?? "").trim().slice(0, MAX_TEXT);
  const kind = String(formData.get("kind") ?? "");
  if (!text || !(SPIRIT_KINDS as readonly string[]).includes(kind)) return;

  const { supabase, user } = await getUserClient();
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .single();

  await supabase.from("spirit_entries").insert({
    user_id: user.id,
    entry_date: todayInTimeZone(profile?.timezone ?? "America/Sao_Paulo"),
    kind,
    text,
  });

  revalidatePath("/espaco");
  revalidatePath("/progresso");
}

export async function deleteSpiritEntry(id: string) {
  const { supabase, user } = await getUserClient();
  if (!user) return;
  await supabase.from("spirit_entries").delete().eq("id", id);
  revalidatePath("/espaco");
  revalidatePath("/progresso");
}

export async function saveSpiritLabel(formData: FormData) {
  const label = String(formData.get("label") ?? "").trim().slice(0, MAX_LABEL);

  const { supabase, user } = await getUserClient();
  if (!user) return;

  await supabase.from("spirit_settings").upsert({
    user_id: user.id,
    practice_label: label,
    updated_at: new Date().toISOString(),
  });

  revalidatePath("/espaco");
}
