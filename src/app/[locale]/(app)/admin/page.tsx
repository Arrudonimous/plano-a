import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/admin";
import { createProgram } from "@/lib/actions/admin";
import { localized } from "@/lib/content/localized";
import { LocalizedFields } from "@/components/admin/LocalizedFields";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { getLocale } from "next-intl/server";

export default async function AdminPage() {
  const { supabase } = await requireAdmin();
  const t = await getTranslations("admin");
  const locale = await getLocale();

  const { data: programs } = await supabase
    .from("programs")
    .select("*")
    .order("kind")
    .order("position")
    .order("created_at");

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <Link href="/admin/metricas" className="text-sm font-medium text-primary">
          {t("metrics")} →
        </Link>
      </div>

      <ul className="space-y-2">
        {(programs ?? []).map((p) => (
          <li key={p.id}>
            <Link href={`/admin/programas/${p.id}`} className="block">
              <Card className="flex items-center justify-between gap-3 p-4 hover:bg-surface-muted">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{localized(p.title, locale)}</span>
                  <span className="block text-xs text-muted-foreground">
                    {t(`kinds.${p.kind}`)} · {p.slug}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {p.published ? t("published") : t("draft")}
                  {p.access === "premium" ? ` · ${t("premium")}` : ""}
                </span>
              </Card>
            </Link>
          </li>
        ))}
      </ul>

      <Card>
        <h2 className="mb-3 text-sm font-semibold">{t("newProgram")}</h2>
        <form action={createProgram} className="space-y-3">
          <Input name="slug" placeholder={t("slugPlaceholder")} pattern="[a-z0-9\-]{2,60}" required />
          <select
            name="kind"
            defaultValue="program"
            aria-label={t("kind")}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm"
          >
            {(["program", "journey", "meditation"] as const).map((k) => (
              <option key={k} value={k}>
                {t(`kinds.${k}`)}
              </option>
            ))}
          </select>
          <LocalizedFields field="title" label={t("titleLabel")} maxLength={120} />
          <Button type="submit">{t("create")}</Button>
        </form>
      </Card>
    </div>
  );
}
