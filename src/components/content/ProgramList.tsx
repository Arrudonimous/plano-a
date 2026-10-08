import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { localized } from "@/lib/content/localized";
import type { ProgramCard } from "@/lib/content/load";
import { Card } from "@/components/ui/Card";

export async function ProgramList({ cards }: { cards: ProgramCard[] }) {
  const t = await getTranslations("conteudo");
  const locale = await getLocale();

  if (cards.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <ul className="space-y-3">
      {cards.map(({ program, totalLessons, doneLessons, enrolled }) => (
        <li key={program.id}>
          <Link href={`/conteudo/${program.slug}`} className="block">
            <Card className="space-y-1 transition-colors hover:bg-surface-muted">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-sm font-semibold">{localized(program.title, locale)}</h2>
                {program.access === "premium" && (
                  <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                    {t("premium")}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{localized(program.summary, locale)}</p>
              <p className="pt-1 text-xs font-medium text-primary">
                {enrolled && totalLessons > 0
                  ? t("progressOf", { done: doneLessons, total: totalLessons })
                  : t("open")}{" "}
                →
              </p>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
