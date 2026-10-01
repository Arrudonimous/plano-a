"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Tabs } from "@/components/ui/Tabs";

export function SonhosTabs({
  listContent,
  boardContent,
}: {
  listContent: ReactNode;
  boardContent: ReactNode;
}) {
  const t = useTranslations("sonhos");

  return (
    <Tabs
      tabs={[
        { id: "lista", label: t("tabList"), content: listContent },
        { id: "mural", label: t("tabBoard"), content: boardContent },
      ]}
    />
  );
}
