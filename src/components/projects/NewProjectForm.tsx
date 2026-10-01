import { useTranslations } from "next-intl";
import { createProject } from "@/lib/actions/projects";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function NewProjectForm() {
  const t = useTranslations("projetos");

  return (
    <form action={createProject} className="flex gap-2">
      <Input name="title" placeholder={t("newPlaceholder")} maxLength={120} required />
      <Button type="submit" className="shrink-0">
        {t("create")}
      </Button>
    </form>
  );
}
