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

export async function createHabit(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("habits").insert({ user_id: user.id, name });

  revalidatePath("/acao");
  revalidatePath("/hoje");
}

export async function archiveHabit(id: string) {
  const supabase = await createClient();
  await supabase
    .from("habits")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/acao");
  revalidatePath("/hoje");
}

export async function checkInHabit(habitId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const timezone = await currentUserTimezone(supabase, user.id);
  const today = todayInTimeZone(timezone);

  await supabase
    .from("habit_checkins")
    .upsert(
      { habit_id: habitId, user_id: user.id, checkin_date: today },
      { onConflict: "habit_id,checkin_date", ignoreDuplicates: true },
    );

  revalidatePath("/acao");
  revalidatePath("/hoje");
  revalidatePath(`/acao/habitos/${habitId}`);
}

export async function undoHabitCheckIn(habitId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const timezone = await currentUserTimezone(supabase, user.id);
  const today = todayInTimeZone(timezone);

  await supabase
    .from("habit_checkins")
    .delete()
    .eq("habit_id", habitId)
    .eq("checkin_date", today);

  revalidatePath("/acao");
  revalidatePath("/hoje");
  revalidatePath(`/acao/habitos/${habitId}`);
}
