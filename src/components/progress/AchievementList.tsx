import { useTranslations } from "next-intl";
import type { Achievement } from "@/lib/progress/achievements";

export function AchievementList({
  achievements,
  next,
}: {
  achievements: Achievement[];
  next: Achievement[];
}) {
  const t = useTranslations("progresso");

  const unlocked = achievements.filter((a) => a.unlocked);
  const nextIds = new Set(next.map((a) => a.id));
  const toDiscover = achievements.filter((a) => !a.unlocked && !nextIds.has(a.id));

  return (
    <div className="space-y-5">
      {unlocked.length > 0 ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {unlocked.map((a) => (
            <li
              key={a.id}
              className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-3 shadow-sm"
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm text-accent-foreground"
                aria-hidden="true"
              >
                ✓
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">
                  {t(`achievements.${a.id}.title`)}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {t(`achievements.${a.id}.description`)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t("noneYet")}</p>
      )}

      {next.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground">{t("inProgress")}</h3>
          <ul className="space-y-2">
            {next.map((a) => (
              <li key={a.id} className="rounded-2xl border border-border bg-surface p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium">{t(`achievements.${a.id}.title`)}</span>
                  <span className="text-xs text-muted-foreground">
                    {t("progressOf", { current: a.current, target: a.target })}
                  </span>
                </div>
                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted"
                  role="progressbar"
                  aria-valuenow={a.current}
                  aria-valuemin={0}
                  aria-valuemax={a.target}
                >
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${Math.round((a.current / a.target) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {toDiscover.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground">{t("toDiscover")}</h3>
          <ul className="flex flex-wrap gap-2">
            {toDiscover.map((a) => (
              <li
                key={a.id}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                {t(`achievements.${a.id}.title`)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
