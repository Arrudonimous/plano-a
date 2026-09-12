"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updatePreferences(formData: FormData) {
  const currency = String(formData.get("currency") ?? "BRL");
  const timezone = String(formData.get("timezone") ?? "America/Sao_Paulo");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("profiles")
    .update({ preferred_currency: currency, timezone })
    .eq("id", user.id);

  revalidatePath("/configuracoes");
}
