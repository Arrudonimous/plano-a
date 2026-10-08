"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { rateLimit } from "@/lib/rateLimit";
import { createClient } from "@/lib/supabase/server";
import { addDaysISO, todayInTimeZone } from "@/lib/utils/dates";
import { AFFIRMATIONS_AVOID_REPEAT_DAYS } from "@/lib/affirmations/config";
import { generateAffirmations } from "@/lib/affirmations/generate";

export interface AffirmationActionState {
  success?: boolean;
  error?: string;
}

const UNIQUE_VIOLATION = "23505";

export async function generateTodaysAffirmations(): Promise<AffirmationActionState> {
  const t = await getTranslations("afirmacoes");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t("errorGeneric") };

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, timezone, preferred_language")
    .eq("id", user.id)
    .single();
  const today = todayInTimeZone(profile?.timezone ?? "America/Sao_Paulo");

  const { data: existing } = await supabase
    .from("affirmations")
    .select("id")
    .eq("user_id", user.id)
    .eq("for_date", today)
    .limit(1);
  if (existing && existing.length > 0) return { success: true };

  // Cada tentativa pode custar uma chamada à API: limita falhas repetidas.
  if (!(await rateLimit(`affirmations:${user.id}`, 6, 3600))) return { error: t("errorGeneric") };

  const [{ data: dreams }, { data: objectives }, { data: recent }] = await Promise.all([
    supabase
      .from("dreams")
      .select("description")
      .eq("user_id", user.id)
      .is("realized_at", null)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase.from("objectives").select("period, declaration").eq("user_id", user.id),
    supabase
      .from("affirmations")
      .select("text")
      .eq("user_id", user.id)
      .gte("for_date", addDaysISO(today, -AFFIRMATIONS_AVOID_REPEAT_DAYS))
      .order("for_date", { ascending: false }),
  ]);

  const horizonLabel: Record<string, string> = {
    "6_MONTHS": "6 meses",
    "1_YEAR": "1 ano",
    "5_YEARS": "5 anos",
    "10_YEARS": "10 anos",
  };

  let texts: string[];
  try {
    texts = await generateAffirmations({
      language: profile?.preferred_language ?? null,
      name: profile?.display_name ?? null,
      dreams: (dreams ?? []).map((d) => d.description),
      objectives: (objectives ?? [])
        .filter((o) => o.declaration.trim())
        .map((o) => ({ horizon: horizonLabel[o.period] ?? o.period, declaration: o.declaration })),
      recent: (recent ?? []).map((r) => r.text),
    });
  } catch (err) {
    console.error("[affirmations] falha ao gerar:", err);
    return { error: t("errorGeneric") };
  }

  const { error } = await supabase.from("affirmations").insert(
    texts.map((text, index) => ({
      user_id: user.id,
      for_date: today,
      position: index + 1,
      text,
    })),
  );
  // Outra requisição já gerou o lote de hoje: tudo certo.
  if (error && error.code !== UNIQUE_VIOLATION) {
    console.error("[affirmations] falha ao salvar:", error);
    return { error: t("errorGeneric") };
  }

  revalidatePath("/afirmacoes");
  revalidatePath("/hoje");
  return { success: true };
}
