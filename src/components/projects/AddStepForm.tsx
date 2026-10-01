import { useTranslations } from "next-intl";
import { addStep } from "@/lib/actions/projects";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function AddStepForm({ projectId }: { projectId: string }) {
  const t = useTranslations("projetos");

  return (
    <form action={addStep.bind(null, projectId)} className="flex gap-2">
      <Input name="title" placeholder={t("stepPlaceholder")} maxLength={200} required />
      <Button type="submit" variant="secondary" className="shrink-0">
        {t("addStep")}
      </Button>
    </form>
  );
}
