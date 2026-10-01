"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Tabs } from "@/components/ui/Tabs";

export function AcaoTabs({
  todayContent,
  habitsContent,
  projectsContent,
}: {
  todayContent: ReactNode;
  habitsContent: ReactNode;
  projectsContent: ReactNode;
}) {
  const t = useTranslations("acao");

  return (
    <Tabs
      tabs={[
        { id: "hoje", label: t("tabHoje"), content: todayContent },
        { id: "habitos", label: t("tabHabitos"), content: habitsContent },
        { id: "projetos", label: t("tabProjetos"), content: projectsContent },
      ]}
    />
  );
}
