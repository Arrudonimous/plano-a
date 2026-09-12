import { useTranslations } from "next-intl";
import { createDream } from "@/lib/actions/dreams";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

export function DreamForm() {
  const t = useTranslations("sonhos");

  return (
    <form action={createDream} className="space-y-3">
      <Textarea
        name="description"
        placeholder={t("descriptionPlaceholder")}
        rows={2}
        required
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex-1 text-sm text-muted-foreground">
          {t("targetDate")}
          <Input type="date" name="targetDate" className="mt-1" />
        </label>
        <Button type="submit" className="sm:self-end">
          {t("addNew")}
        </Button>
      </div>
    </form>
  );
}
