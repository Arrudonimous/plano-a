import { useTranslations } from "next-intl";
import type { ActivityDay } from "@/lib/progress/achievements";

export function ActivityMap({ days }: { days: ActivityDay[] }) {
  const t = useTranslations("progresso");
  const activeCount = days.filter((d) => d.active).length;

  // Alinha a primeira coluna à segunda-feira (grid preenche por coluna, 7 linhas).
  const firstWeekday = new Date(`${days[0].date}T00:00:00Z`).getUTCDay();
  const padding = (firstWeekday + 6) % 7;

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div
          role="img"
          aria-label={t("activityAria", { count: activeCount, weeks: days.length / 7 })}
          className="grid w-max grid-flow-col grid-rows-7 gap-1"
        >
          {Array.from({ length: padding }, (_, i) => (
            <span key={`pad-${i}`} className="h-3.5 w-3.5" />
          ))}
          {days.map((day) => (
            <span
              key={day.date}
              title={day.date}
              className={`h-3.5 w-3.5 rounded-[3px] ${
                day.active ? "bg-accent" : "bg-surface-muted"
              }`}
            />
          ))}
        </div>
      </div>
      <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="h-3 w-3 rounded-[3px] bg-accent" aria-hidden="true" />
        {t("activityLegend")}
      </p>
    </div>
  );
}
