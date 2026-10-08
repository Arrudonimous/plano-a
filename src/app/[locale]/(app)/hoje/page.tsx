import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { greetingPeriod, todayInTimeZone } from "@/lib/utils/dates";
import { Link } from "@/i18n/navigation";
import { loadContinue } from "@/lib/content/load";
import { localized } from "@/lib/content/localized";
import { Card } from "@/components/ui/Card";
import { ActionIcon, StarIcon, TargetIcon, WalletIcon } from "@/components/nav/NavIcons";

const GREETING_KEY = {
  morning: "greetingMorning",
  afternoon: "greetingAfternoon",
  evening: "greetingEvening",
} as const;

export default async function HojePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getTranslations("meuDia");
  const tNav = await getTranslations("nav");
  const locale = await getLocale();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, timezone")
    .eq("id", user!.id)
    .single();

  const timezone = profile?.timezone ?? "America/Sao_Paulo";
  const today = todayInTimeZone(timezone);
  const period = greetingPeriod(timezone);

  const [
    { data: todayActions },
    { data: habits },
    { data: checkins },
    { data: dreams },
    { data: objectives },
    { data: todayAffirmation },
  ] = await Promise.all([
    supabase
      .from("daily_actions")
      .select("id, done_at")
      .eq("user_id", user!.id)
      .eq("due_date", today),
    supabase
      .from("habits")
      .select("id")
      .eq("user_id", user!.id)
      .is("archived_at", null),
    supabase
      .from("habit_checkins")
      .select("habit_id")
      .eq("user_id", user!.id)
      .eq("checkin_date", today),
    supabase.from("dreams").select("id, realized_at").eq("user_id", user!.id),
    supabase
      .from("objectives")
      .select("period, declaration")
      .eq("user_id", user!.id),
    supabase
      .from("affirmations")
      .select("text")
      .eq("user_id", user!.id)
      .eq("for_date", today)
      .order("position", { ascending: true })
      .limit(1),
  ]);

  const journey = await loadContinue(supabase, user!.id);
  const activeHabits = habits ?? [];
  const checkedInHabitIds = new Set((checkins ?? []).map((c) => c.habit_id));
  const habitsDone = activeHabits.filter((h) => checkedInHabitIds.has(h.id)).length;
  const actionsTotal = todayActions?.length ?? 0;
  const actionsDone = (todayActions ?? []).filter((a) => a.done_at).length;

  const stepsTotal = actionsTotal + activeHabits.length;
  const stepsDone = actionsDone + habitsDone;
  const progress = stepsTotal === 0 ? 0 : Math.round((stepsDone / stepsTotal) * 100);

  const dreamsTotal = dreams?.length ?? 0;
  const dreamsRealized = (dreams ?? []).filter((d) => d.realized_at).length;
  const objectivesFilled = (objectives ?? []).filter((o) =>
    o.declaration.trim(),
  ).length;

  const name = profile?.display_name || user!.email?.split("@")[0] || "";

  const shortcuts = [
    {
      href: "/sonhos",
      title: tNav("sonhos"),
      summary:
        dreamsTotal === 0
          ? t("dreamsEmpty")
          : t("dreamsSummary", { realized: dreamsRealized, total: dreamsTotal }),
      Icon: StarIcon,
    },
    {
      href: "/objetivos",
      title: tNav("objetivos"),
      summary: t("objectivesSummary", { count: objectivesFilled }),
      Icon: TargetIcon,
    },
    {
      href: "/acao",
      title: tNav("acao"),
      summary: t("actionSummary", {
        actions: actionsTotal,
        habits: activeHabits.length,
      }),
      Icon: ActionIcon,
    },
    {
      href: "/financeiro",
      title: t("financeTile"),
      summary: t("financeHint"),
      Icon: WalletIcon,
    },
  ] as const;

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <section className="rounded-3xl bg-gradient-to-br from-hero-from to-hero-to p-6 text-white shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t(GREETING_KEY[period], { name })}
        </h1>
        <p className="mt-2 text-sm text-white/75">{t("dailyMessage")}</p>
      </section>

      <Link href="/afirmacoes" className="block">
        <Card className="transition-colors hover:bg-surface-muted">
          <p className="text-xs font-medium text-accent">{t("affirmationTitle")}</p>
          {todayAffirmation?.[0] ? (
            <p className="mt-2 text-base leading-relaxed">
              “{todayAffirmation[0].text}”
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">{t("affirmationEmpty")}</p>
          )}
          <p className="mt-3 text-xs font-medium text-primary">
            {todayAffirmation?.[0] ? t("affirmationMore") : t("affirmationCta")} →
          </p>
        </Card>
      </Link>

      <Link href={journey ? `/conteudo/${journey.program.slug}` : "/jornadas"} className="block">
        <Card className="transition-colors hover:bg-surface-muted">
          <p className="text-xs font-medium text-accent">{t("journeyTitle")}</p>
          {journey ? (
            <>
              <p className="mt-2 text-base font-semibold">{localized(journey.program.title, locale)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("journeyNext", { lesson: journey.nextLesson, done: journey.done, total: journey.total })}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">{t("journeyDiscover")}</p>
          )}
          <p className="mt-3 text-xs font-medium text-primary">
            {journey ? t("journeyContinue") : t("journeyStart")} →
          </p>
        </Card>
      </Link>

      <Card>
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">{t("progressTitle")}</h2>
          {stepsTotal > 0 && (
            <span className="text-xs font-medium text-accent">{progress}%</span>
          )}
        </div>
        {stepsTotal === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{t("emptyToday")}</p>
        ) : (
          <>
            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {stepsDone === stepsTotal
                ? t("progressComplete")
                : t("progressSummary", { done: stepsDone, total: stepsTotal })}
            </p>
          </>
        )}
        <Link
          href="/acao"
          className="mt-3 inline-block text-sm font-medium text-primary"
        >
          {t("viewActions")} →
        </Link>
      </Card>

      <ul className="space-y-3">
        {shortcuts.map(({ href, title, summary, Icon }) => (
          <li key={href}>
            <Link href={href} className="block">
              <Card className="flex items-center gap-4 p-4 transition-colors hover:bg-surface-muted">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-accent">
                  <Icon />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {summary}
                  </span>
                </span>
                <span aria-hidden="true" className="text-muted-foreground">
                  →
                </span>
              </Card>
            </Link>
          </li>
        ))}
      </ul>

      <ul className="grid grid-cols-2 gap-3">
        {[
          { href: "/gratidao", title: t("gratitudeTile"), hint: t("gratitudeHint") },
          { href: "/progresso", title: t("progressTile"), hint: t("progressHint") },
        ].map(({ href, title, hint }) => (
          <li key={href}>
            <Link href={href} className="block h-full">
              <Card className="h-full p-4 transition-colors hover:bg-surface-muted">
                <span className="block text-sm font-semibold">{title}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
