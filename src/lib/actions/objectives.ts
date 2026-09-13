"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import type { ObjectivePeriod } from "@/lib/types/database.types";

export interface ObjectiveActionState {
  success?: boolean;
  error?: string;
}

export async function upsertObjective(
  period: ObjectivePeriod,
  _prevState: ObjectiveActionState,
  formData: FormData,
): Promise<ObjectiveActionState> {
  const declaration = String(formData.get("declaration") ?? "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const t = await getTranslations("objetivos");
    return { error: t("error") };
  }

  await supabase
    .from("objectives")
    .upsert(
      { user_id: user.id, period, declaration, updated_at: new Date().toISOString() },
      { onConflict: "user_id,period" },
    );

  revalidatePath("/objetivos");
  return { success: true };
}
