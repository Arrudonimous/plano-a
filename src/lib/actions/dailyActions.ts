"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayInTimeZone } from "@/lib/utils/dates";

async function currentUserTimezone(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", userId)
    .single();
  return data?.timezone ?? "America/Sao_Paulo";
}

export async function createDailyAction(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const timezone = await currentUserTimezone(supabase, user.id);
  const dueDate = todayInTimeZone(timezone);

  await supabase
    .from("daily_actions")
    .insert({ user_id: user.id, title, due_date: dueDate });

  revalidatePath("/acao");
  revalidatePath("/hoje");
}

export async function toggleDailyActionDone(id: string, done: boolean) {
  const supabase = await createClient();
  await supabase
    .from("daily_actions")
    .update({ done_at: done ? new Date().toISOString() : null })
    .eq("id", id);

  revalidatePath("/acao");
  revalidatePath("/hoje");
}

export async function deleteDailyAction(id: string) {
  const supabase = await createClient();
  await supabase.from("daily_actions").delete().eq("id", id);
  revalidatePath("/acao");
  revalidatePath("/hoje");
}
