"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayInTimeZone } from "@/lib/utils/dates";

const MAX_LENGTH = 500;

export async function createGratitude(formData: FormData) {
  const text = String(formData.get("text") ?? "").trim().slice(0, MAX_LENGTH);
  if (!text) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .single();

  await supabase.from("gratitude_entries").insert({
    user_id: user.id,
    entry_date: todayInTimeZone(profile?.timezone ?? "America/Sao_Paulo"),
    text,
  });

  revalidatePath("/gratidao");
  revalidatePath("/progresso");
}

export async function deleteGratitude(id: string) {
  const supabase = await createClient();
  await supabase.from("gratitude_entries").delete().eq("id", id);
  revalidatePath("/gratidao");
  revalidatePath("/progresso");
}
