import { getFormatter, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { addDaysISO, todayInTimeZone } from "@/lib/utils/dates";
import { Card } from "@/components/ui/Card";
import {
  SpiritEntryForm,
  SpiritEntryItem,
  SpiritLabelForm,
} from "@/components/spirit/SpiritForms";

const HISTORY_DAYS = 60;
const PROMPT_COUNT = 14;

/** Dia do ano (1–366) de uma data YYYY-MM-DD, para escolher a pergunta do dia. */
function dayOfYear(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86_400_000);
}

export default async function EspacoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getTranslations("espaco");
  const format = await getFormatter();

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user!.id)
    .single();
  const today = todayInTimeZone(profile?.timezone ?? "America/Sao_Paulo");

  const [{ data: settings }, { data: entries }] = await Promise.all([
    supabase.from("spirit_settings").select("practice_label").eq("user_id", user!.id).maybeSingle(),
    supabase
      .from("spirit_entries")
      .select("*")
      .eq("user_id", user!.id)
      .gte("entry_date", addDaysISO(today, -HISTORY_DAYS))
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const byDate = new Map<string, NonNullable<typeof entries>>();
  for (const entry of entries ?? []) {
    byDate.set(entry.entry_date, [...(byDate.get(entry.entry_date) ?? []), entry]);
  }

  const promptKey = `prompts.p${(dayOfYear(today) % PROMPT_COUNT) + 1}` as const;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card>
        <p className="text-xs font-medium text-accent">{t("promptTitle")}</p>
        <p className="mt-2 text-base leading-relaxed">{t(promptKey)}</p>
      </Card>

      <SpiritEntryForm />

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">{t("labelTitle")}</h2>
        <p className="text-xs text-muted-foreground">{t("labelHint")}</p>
        <SpiritLabelForm defaultValue={settings?.practice_label ?? ""} />
      </section>

      {byDate.size === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="space-y-5">
          {[...byDate.entries()].map(([date, items]) => (
            <section key={date} className="space-y-2">
              <h2 className="text-xs font-semibold text-muted-foreground">
                {date === today
                  ? t("today")
                  : format.dateTime(new Date(`${date}T00:00:00Z`), {
                      dateStyle: "long",
                      timeZone: "UTC",
                    })}
              </h2>
              <ul className="space-y-2">
                {items.map((item) => (
                  <SpiritEntryItem key={item.id} id={item.id} kind={item.kind} text={item.text} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">{t("privacy")}</p>
    </div>
  );
}
