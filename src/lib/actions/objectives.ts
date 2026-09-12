"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ObjectivePeriod } from "@/lib/types/database.types";

export async function upsertObjective(period: ObjectivePeriod, formData: FormData) {
  const declaration = String(formData.get("declaration") ?? "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("objectives")
    .upsert(
      { user_id: user.id, period, declaration, updated_at: new Date().toISOString() },
      { onConflict: "user_id,period" },
    );

  revalidatePath("/objetivos");
}
