import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { updatePreferences } from "@/lib/actions/profile";
import { LanguageSwitcher } from "@/components/settings/LanguageSwitcher";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getTranslations("settings");
  const tCommon = await getTranslations("common");

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_currency, timezone")
    .eq("id", user!.id)
    .single();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <h1 className="text-xl font-semibold">{t("title")}</h1>

      <Card>
        <p className="text-sm font-medium">{t("language")}</p>
        <div className="mt-2">
          <LanguageSwitcher />
        </div>
      </Card>

      <form
        action={updatePreferences}
        className="space-y-4 rounded-2xl border border-border bg-surface p-5"
      >
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="currency">
            {t("currency")}
          </label>
          <Input
            id="currency"
            name="currency"
            defaultValue={profile?.preferred_currency ?? "BRL"}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="timezone">
            {t("timezone")}
          </label>
          <Input
            id="timezone"
            name="timezone"
            defaultValue={profile?.timezone ?? "America/Sao_Paulo"}
          />
        </div>
        <Button type="submit">{tCommon("save")}</Button>
      </form>
    </div>
  );
}
