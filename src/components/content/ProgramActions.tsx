"use client";

import { useTranslations } from "next-intl";
import { createJourneyProject, startProgram } from "@/lib/actions/content";
import { Button } from "@/components/ui/Button";

export function StartButton({ programId }: { programId: string }) {
  const t = useTranslations("conteudo");
  return (
    <form action={startProgram.bind(null, programId)}>
      <Button type="submit">{t("start")}</Button>
    </form>
  );
}

export function JourneyProjectButton({
  programId,
  hasProject,
}: {
  programId: string;
  hasProject: boolean;
}) {
  const t = useTranslations("conteudo");
  return (
    <form action={createJourneyProject.bind(null, programId)}>
      <Button type="submit" variant="secondary">
        {hasProject ? t("openProject") : t("createProject")}
      </Button>
    </form>
  );
}
