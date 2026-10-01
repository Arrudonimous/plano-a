import { getFormatter, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { addDaysISO, todayInTimeZone } from "@/lib/utils/dates";
import { AFFIRMATIONS_HISTORY_DAYS } from "@/lib/affirmations/config";
import { GenerateToday } from "@/components/affirmations/GenerateToday";
import { Card } from "@/components/ui/Card";

export default async function AfirmacoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getTranslations("afirmacoes");
  const format = await getFormatter();

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user!.id)
    .single();
  const today = todayInTimeZone(profile?.timezone ?? "America/Sao_Paulo");

  const { data: rows } = await supabase
    .from("affirmations")
    .select("*")
    .eq("user_id", user!.id)
    .gte("for_date", addDaysISO(today, -AFFIRMATIONS_HISTORY_DAYS))
    .order("for_date", { ascending: false })
    .order("position", { ascending: true });

  const byDate = new Map<string, string[]>();
  for (const row of rows ?? []) {
    byDate.set(row.for_date, [...(byDate.get(row.for_date) ?? []), row.text]);
  }
  const todayItems = byDate.get(today);
  const previous = [...byDate.entries()].filter(([date]) => date !== today);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {todayItems ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-accent">{t("today")}</h2>
          {todayItems.map((text, index) => (
            <Card key={index} className="border-l-4 border-l-accent">
              <p className="text-lg leading-relaxed">{text}</p>
            </Card>
          ))}
        </section>
      ) : (
        <GenerateToday />
      )}

      {previous.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground">{t("previous")}</h2>
          {previous.map(([date, items]) => (
            <div key={date} className="space-y-1.5">
              <p className="text-xs text-muted-foreground">
                {format.dateTime(new Date(`${date}T00:00:00Z`), {
                  dateStyle: "long",
                  timeZone: "UTC",
                })}
              </p>
              <ul className="space-y-1.5 text-sm leading-relaxed">
                {items.map((text, index) => (
                  <li key={index}>{text}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      <p className="text-xs text-muted-foreground">{t("aiNote")}</p>
    </div>
  );
}
