"use client";

import { useTranslations } from "next-intl";

export function DeleteButton({
  action,
  confirmText,
}: {
  action: () => Promise<void>;
  confirmText: string;
}) {
  const tCommon = useTranslations("common");

  return (
    <button
      type="button"
      className="shrink-0 rounded-full px-2 py-1 text-xs text-muted-foreground hover:bg-danger/10 hover:text-danger"
      onClick={() => {
        if (window.confirm(confirmText)) action();
      }}
    >
      {tCommon("delete")}
    </button>
  );
}
