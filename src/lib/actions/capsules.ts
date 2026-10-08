"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { todayInTimeZone } from "@/lib/utils/dates";
import {
  CAPSULE_MAX_MESSAGE_LENGTH,
  capsuleDateBounds,
} from "@/lib/capsules/config";

export interface CapsuleActionState {
  success?: boolean;
  error?: string;
}

export async function createCapsule(
  _prevState: CapsuleActionState,
  formData: FormData,
): Promise<CapsuleActionState> {
  const t = await getTranslations("capsula");
  const message = String(formData.get("message") ?? "").trim();
  const deliverOn = String(formData.get("deliverOn") ?? "").trim();

  if (!message) return { error: t("errorMessage") };
  if (message.length > CAPSULE_MAX_MESSAGE_LENGTH) return { error: t("errorTooLong") };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deliverOn)) return { error: t("errorDate") };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t("errorGeneric") };

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .single();
  const { data: premium } = await supabase.rpc("has_premium");
  const { min, max, freeMax } = capsuleDateBounds(
    todayInTimeZone(profile?.timezone ?? "America/Sao_Paulo"),
    Boolean(premium),
  );
  if (deliverOn < min) return { error: t("errorDatePast") };
  if (deliverOn > max) return { error: t(premium ? "errorDateTooFarPremium" : "errorDateTooFar") };

  // Além de 1 ano só com retenção estendida (Premium); o banco também exige.
  const { error } = await supabase.from("time_capsules").insert({
    user_id: user.id,
    message,
    deliver_on: deliverOn,
    retention_tier: deliverOn > freeMax ? "extended" : "free",
  });
  if (error) return { error: t("errorGeneric") };

  revalidatePath("/sonhos");
  return { success: true };
}

export async function deleteCapsule(id: string) {
  const supabase = await createClient();
  await supabase.from("time_capsules").delete().eq("id", id);
  revalidatePath("/sonhos");
}
