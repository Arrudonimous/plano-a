"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { cancelSubscription } from "@/lib/billing/stripe";
import { isSupportedCurrency } from "@/lib/finance/finance";
import { rateLimit } from "@/lib/rateLimit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isValidTimeZone } from "@/lib/utils/dates";

export async function updatePreferences(formData: FormData) {
  const currency = String(formData.get("currency") ?? "BRL").toUpperCase();
  const timezone = String(formData.get("timezone") ?? "America/Sao_Paulo");
  // Valores inválidos quebrariam formatação de moeda e cálculo de datas.
  if (!isSupportedCurrency(currency) || !isValidTimeZone(timezone)) return;

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
  revalidatePath("/financeiro");
}

export async function setAnalyticsConsent(enabled: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("profiles").update({ analytics_opt_in: enabled }).eq("id", user.id);
  revalidatePath("/configuracoes");
}

export interface DeleteAccountState {
  error?: "confirm" | "billing" | "failed" | "limit";
}

/** Exclui a conta e todos os dados (cascata no banco + arquivos do mural). */
export async function deleteAccount(
  _prev: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "failed" };

  const typed = String(formData.get("confirm") ?? "").trim().toLowerCase();
  if (!user.email || typed !== user.email.toLowerCase()) return { error: "confirm" };
  if (!(await rateLimit(`delete-account:${user.id}`, 3, 3600))) return { error: "limit" };

  try {
    const admin = createAdminClient();

    // Cancela a cobrança primeiro: se falhar, a conta NÃO é excluída (evita cobrar quem não existe mais).
    const { data: sub } = await admin
      .from("subscriptions")
      .select("provider_subscription_id, status")
      .eq("user_id", user.id)
      .maybeSingle();
    if (sub?.provider_subscription_id && sub.status !== "canceled") {
      try {
        await cancelSubscription(sub.provider_subscription_id);
      } catch {
        return { error: "billing" };
      }
    }

    // Arquivos do mural (não caem em cascata).
    for (;;) {
      const { data: files } = await admin.storage.from("dream-board").list(user.id, { limit: 1000 });
      if (!files || files.length === 0) break;
      await admin.storage.from("dream-board").remove(files.map((f) => `${user.id}/${f.name}`));
      if (files.length < 1000) break;
    }

    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) return { error: "failed" };
  } catch {
    return { error: "failed" };
  }

  await supabase.auth.signOut();
  redirect({ href: "/login", locale: await getLocale() });
  return {};
}
