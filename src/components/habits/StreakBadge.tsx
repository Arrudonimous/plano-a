import { useTranslations } from "next-intl";

export function StreakBadge({ streak }: { streak: number }) {
  const t = useTranslations("acao");

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-xs text-muted-foreground">
      🔥 {t("streakLabel", { count: streak })}
    </span>
  );
}
