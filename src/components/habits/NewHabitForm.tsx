import { useTranslations } from "next-intl";
import { createHabit } from "@/lib/actions/habits";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function NewHabitForm() {
  const t = useTranslations("acao");

  return (
    <form action={createHabit} className="flex gap-2">
      <Input name="name" placeholder={t("habitPlaceholder")} required />
      <Button type="submit">{t("addHabit")}</Button>
    </form>
  );
}
