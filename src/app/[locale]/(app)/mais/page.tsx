import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { MORE_MODULES } from "@/components/nav/modules";
import { Card } from "@/components/ui/Card";

export default async function MaisPage() {
  const t = await getTranslations("mais");

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <ul className="space-y-3">
        {MORE_MODULES.map(({ href, key }) => (
          <li key={href}>
            <Link href={href} className="block">
              <Card className="flex items-center gap-4 p-4 transition-colors hover:bg-surface-muted">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{t(`${key}.title`)}</span>
                  <span className="block text-xs text-muted-foreground">{t(`${key}.hint`)}</span>
                </span>
                <span aria-hidden="true" className="text-muted-foreground">
                  →
                </span>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
