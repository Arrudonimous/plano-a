"use client";

import { useTranslations } from "next-intl";
import { deleteLesson, moveLesson } from "@/lib/actions/admin";

export function LessonControls({
  programId,
  lessonId,
  isFirst,
  isLast,
}: {
  programId: string;
  lessonId: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const button =
    "rounded-full px-2 py-1 text-xs text-muted-foreground hover:bg-surface-muted hover:text-foreground disabled:opacity-30";

  return (
    <div className="flex items-center gap-1">
      <button type="button" className={button} disabled={isFirst} aria-label={t("moveUp")} onClick={() => moveLesson(programId, lessonId, "up")}>
        ↑
      </button>
      <button type="button" className={button} disabled={isLast} aria-label={t("moveDown")} onClick={() => moveLesson(programId, lessonId, "down")}>
        ↓
      </button>
      <button
        type="button"
        className="rounded-full px-2 py-1 text-xs text-muted-foreground hover:bg-danger/10 hover:text-danger"
        onClick={() => {
          if (window.confirm(t("confirmDeleteLesson"))) deleteLesson(programId, lessonId);
        }}
      >
        {tCommon("delete")}
      </button>
    </div>
  );
}

export function DeleteProgramButton({ action }: { action: () => Promise<void> }) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  return (
    <button
      type="button"
      className="rounded-full px-3 py-1.5 text-xs text-danger hover:bg-danger/10"
      onClick={() => {
        if (window.confirm(t("confirmDeleteProgram"))) action();
      }}
    >
      {tCommon("delete")}
    </button>
  );
}
