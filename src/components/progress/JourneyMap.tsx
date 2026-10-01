import { useTranslations } from "next-intl";
import type { ObjectivePeriod } from "@/lib/types/database.types";

const HORIZONS: { period: ObjectivePeriod; labelKey: string }[] = [
  { period: "6_MONTHS", labelKey: "period6Months" },
  { period: "1_YEAR", labelKey: "period1Year" },
  { period: "5_YEARS", labelKey: "period5Years" },
  { period: "10_YEARS", labelKey: "period10Years" },
];

export function JourneyMap({ defined }: { defined: ObjectivePeriod[] }) {
  const t = useTranslations("objetivos");
  const tp = useTranslations("progresso");

  return (
    <ol className="flex items-start" aria-label={tp("mapTitle")}>
      {HORIZONS.map(({ period, labelKey }, index) => {
        const isDefined = defined.includes(period);
        return (
          <li key={period} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full items-center">
              <span
                className={`h-0.5 flex-1 ${index === 0 ? "opacity-0" : "bg-border"}`}
                aria-hidden="true"
              />
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs ${
                  isDefined
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-surface text-muted-foreground"
                }`}
              >
                {isDefined ? "✓" : ""}
              </span>
              <span
                className={`h-0.5 flex-1 ${
                  index === HORIZONS.length - 1 ? "opacity-0" : "bg-border"
                }`}
                aria-hidden="true"
              />
            </div>
            <span
              className={`text-xs ${isDefined ? "font-medium" : "text-muted-foreground"}`}
            >
              {t(labelKey)}
            </span>
            <span className="sr-only">{isDefined ? tp("horizonDefined") : tp("horizonOpen")}</span>
          </li>
        );
      })}
    </ol>
  );
}
