import { useTranslations } from "next-intl";
import { createDailyAction } from "@/lib/actions/dailyActions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function QuickAddAction() {
  const t = useTranslations("acao");

  return (
    <form action={createDailyAction} className="flex gap-2">
      <Input name="title" placeholder={t("actionPlaceholder")} required />
      <Button type="submit">{t("addAction")}</Button>
    </form>
  );
}
