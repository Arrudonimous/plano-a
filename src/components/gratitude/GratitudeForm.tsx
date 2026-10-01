import { useTranslations } from "next-intl";
import { createGratitude } from "@/lib/actions/gratitude";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

export function GratitudeForm() {
  const t = useTranslations("gratidao");

  return (
    <form action={createGratitude} className="space-y-3">
      <Textarea
        name="text"
        placeholder={t("placeholder")}
        rows={2}
        maxLength={500}
        required
      />
      <Button type="submit">{t("add")}</Button>
    </form>
  );
}
