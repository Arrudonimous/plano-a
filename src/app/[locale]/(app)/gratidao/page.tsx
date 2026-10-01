import { getFormatter, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { addDaysISO, todayInTimeZone } from "@/lib/utils/dates";
import { GratitudeForm } from "@/components/gratitude/GratitudeForm";
import { GratitudeItem } from "@/components/gratitude/GratitudeItem";

const HISTORY_DAYS = 30;

export default async function GratidaoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getTranslations("gratidao");
  const format = await getFormatter();

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user!.id)
    .single();
  const today = todayInTimeZone(profile?.timezone ?? "America/Sao_Paulo");

  const { data: entries } = await supabase
    .from("gratitude_entries")
    .select("*")
    .eq("user_id", user!.id)
    .gte("entry_date", addDaysISO(today, -HISTORY_DAYS))
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });

  const byDate = new Map<string, { id: string; text: string }[]>();
  for (const entry of entries ?? []) {
    byDate.set(entry.entry_date, [
      ...(byDate.get(entry.entry_date) ?? []),
      { id: entry.id, text: entry.text },
    ]);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <GratitudeForm />

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
                  <GratitudeItem key={item.id} id={item.id} text={item.text} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
