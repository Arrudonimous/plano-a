import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { updatePreferences } from "@/lib/actions/profile";
import { SUPPORTED_CURRENCIES } from "@/lib/finance/finance";
import { AnalyticsToggle, DeleteAccountForm } from "@/components/settings/AccountSection";
import { LanguageSwitcher } from "@/components/settings/LanguageSwitcher";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const selectClass =
  "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary";

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getTranslations("settings");
  const tCommon = await getTranslations("common");

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_currency, timezone, analytics_opt_in")
    .eq("id", user!.id)
    .single();

  const timezone = profile?.timezone ?? "America/Sao_Paulo";
  const zones = Intl.supportedValuesOf("timeZone");
  if (!zones.includes(timezone)) zones.unshift(timezone);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <h1 className="text-xl font-semibold">{t("title")}</h1>

      <Card>
        <p className="text-sm font-medium">{t("language")}</p>
        <div className="mt-2">
          <LanguageSwitcher />
        </div>
      </Card>

      <form action={updatePreferences} className="space-y-4 rounded-2xl border border-border bg-surface p-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="currency">
            {t("currency")}
          </label>
          <select id="currency" name="currency" defaultValue={profile?.preferred_currency ?? "BRL"} className={selectClass}>
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="timezone">
            {t("timezone")}
          </label>
          <select id="timezone" name="timezone" defaultValue={timezone} className={selectClass}>
            {zones.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit">{tCommon("save")}</Button>
      </form>

      <Card className="space-y-3">
        <h2 className="text-sm font-semibold">{t("privacyTitle")}</h2>
        <AnalyticsToggle enabled={Boolean(profile?.analytics_opt_in)} />
        <p className="text-xs text-muted-foreground">{t("aiNote")}</p>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/privacidade" className="font-medium text-primary">
            {t("privacyLink")}
          </Link>
          <Link href="/termos" className="font-medium text-primary">
            {t("termsLink")}
          </Link>
        </div>
      </Card>

      <Card className="space-y-2">
        <h2 className="text-sm font-semibold">{t("dataTitle")}</h2>
        <p className="text-xs text-muted-foreground">{t("dataBody")}</p>
        <a href="/api/account/export" download className="inline-block text-sm font-medium text-primary">
          {t("exportButton")}
        </a>
      </Card>

      <DeleteAccountForm email={user!.email ?? ""} />
    </div>
  );
}
