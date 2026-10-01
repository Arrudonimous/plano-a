"use client";

import { useTranslations } from "next-intl";
import { deleteGratitude } from "@/lib/actions/gratitude";

export function GratitudeItem({ id, text }: { id: string; text: string }) {
  const t = useTranslations("gratidao");
  const tCommon = useTranslations("common");

  return (
    <li className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
      <button
        type="button"
        className="shrink-0 rounded-full px-2 py-1 text-xs text-muted-foreground hover:bg-danger/10 hover:text-danger"
        onClick={() => {
          if (window.confirm(t("confirmDelete"))) deleteGratitude(id);
        }}
      >
        {tCommon("delete")}
      </button>
    </li>
  );
}
