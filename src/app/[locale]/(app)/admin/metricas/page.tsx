import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/admin";
import { Card } from "@/components/ui/Card";

export default async function MetricsPage() {
  const { supabase } = await requireAdmin();
  const t = await getTranslations("admin");
  const tCommon = await getTranslations("common");

  const [{ data: summary30 }, { data: active7 }, { data: active30 }, { count: optIn }] = await Promise.all([
    supabase.rpc("analytics_summary", { days: 30 }),
    supabase.rpc("analytics_active_users", { days: 7 }),
    supabase.rpc("analytics_active_users", { days: 30 }),
    supabase.from("subscriptions").select("user_id", { count: "exact", head: true }).in("status", ["active", "trialing"]),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <Link href="/admin" className="text-xs text-muted-foreground hover:text-foreground">
        ← {tCommon("back")}
      </Link>
      <h1 className="text-xl font-semibold">{t("metrics")}</h1>
      <p className="text-xs text-muted-foreground">{t("metricsNote")}</p>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t("active7"), value: active7 ?? 0 },
          { label: t("active30"), value: active30 ?? 0 },
          { label: t("subscribers"), value: optIn ?? 0 },
        ].map(({ label, value }) => (
          <Card key={label} className="p-4">
            <p className="text-2xl font-semibold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="mb-2 text-sm font-semibold">{t("events30")}</h2>
        {(summary30 ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noEvents")}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="pb-1 font-medium">{t("event")}</th>
                <th className="pb-1 text-right font-medium">{t("total")}</th>
                <th className="pb-1 text-right font-medium">{t("people")}</th>
              </tr>
            </thead>
            <tbody>
              {(summary30 ?? []).map((row) => (
                <tr key={row.event} className="border-t border-border">
                  <td className="py-1.5">{row.event}</td>
                  <td className="py-1.5 text-right">{row.total}</td>
                  <td className="py-1.5 text-right">{row.users}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
