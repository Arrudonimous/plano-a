"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

export function AcaoTabs({
  todayContent,
  habitsContent,
}: {
  todayContent: ReactNode;
  habitsContent: ReactNode;
}) {
  const t = useTranslations("acao");
  const [tab, setTab] = useState<"hoje" | "habitos">("hoje");

  return (
    <div>
      <div className="mb-4 flex gap-4 border-b border-border">
        <button
          type="button"
          onClick={() => setTab("hoje")}
          className={`border-b-2 px-1 pb-2 text-sm ${
            tab === "hoje"
              ? "border-primary font-medium text-primary"
              : "border-transparent text-muted-foreground"
          }`}
        >
          {t("tabHoje")}
        </button>
        <button
          type="button"
          onClick={() => setTab("habitos")}
          className={`border-b-2 px-1 pb-2 text-sm ${
            tab === "habitos"
              ? "border-primary font-medium text-primary"
              : "border-transparent text-muted-foreground"
          }`}
        >
          {t("tabHabitos")}
        </button>
      </div>
      <div hidden={tab !== "hoje"}>{todayContent}</div>
      <div hidden={tab !== "habitos"}>{habitsContent}</div>
    </div>
  );
}
