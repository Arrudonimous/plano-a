"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  deleteStep,
  moveStep,
  sendStepToToday,
  toggleStep,
  updateStep,
} from "@/lib/actions/projects";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Database } from "@/lib/types/database.types";

type Step = Database["public"]["Tables"]["project_steps"]["Row"];

export function StepRow({
  step,
  isFirst,
  isLast,
}: {
  step: Step;
  isFirst: boolean;
  isLast: boolean;
}) {
  const t = useTranslations("projetos");
  const tCommon = useTranslations("common");
  const [editing, setEditing] = useState(false);
  const [sent, setSent] = useState(false);
  const [done, setDone] = useOptimistic(Boolean(step.done_at));
  const [, startTransition] = useTransition();

  const iconButton =
    "rounded-full px-2 py-1 text-xs text-muted-foreground hover:bg-surface-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <li className="rounded-xl border border-border bg-surface px-4 py-3">
      {editing ? (
        <form
          action={async (formData) => {
            await updateStep(step.id, formData);
            setEditing(false);
          }}
          className="flex gap-2"
        >
          <Input name="title" defaultValue={step.title} maxLength={200} required autoFocus />
          <Button type="submit" className="shrink-0 px-4">
            {tCommon("save")}
          </Button>
          <Button type="button" variant="ghost" className="shrink-0 px-3" onClick={() => setEditing(false)}>
            {tCommon("cancel")}
          </Button>
        </form>
      ) : (
        <>
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={done}
              onChange={(event) => {
                const checked = event.target.checked;
                startTransition(async () => {
                  setDone(checked);
                  await toggleStep(step.id, checked);
                });
              }}
              className="mt-0.5 size-4 accent-accent"
              aria-label={step.title}
            />
            <span className={`flex-1 text-sm ${done ? "text-muted-foreground line-through" : ""}`}>
              {step.title}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1 pl-7">
            {!done && (
              <button
                type="button"
                className="rounded-full px-2 py-1 text-xs font-medium text-primary hover:bg-surface-muted disabled:text-accent"
                disabled={sent}
                onClick={async () => setSent(await sendStepToToday(step.id))}
              >
                {sent ? t("sentToToday") : t("sendToToday")}
              </button>
            )}
            <button type="button" className={iconButton} disabled={isFirst} aria-label={t("moveUp")} onClick={() => moveStep(step.id, "up")}>
              ↑
            </button>
            <button type="button" className={iconButton} disabled={isLast} aria-label={t("moveDown")} onClick={() => moveStep(step.id, "down")}>
              ↓
            </button>
            <button type="button" className={iconButton} onClick={() => setEditing(true)}>
              {tCommon("edit")}
            </button>
            <button
              type="button"
              className="rounded-full px-2 py-1 text-xs text-muted-foreground hover:bg-danger/10 hover:text-danger"
              onClick={() => {
                if (window.confirm(t("confirmDeleteStep"))) deleteStep(step.id);
              }}
            >
              {tCommon("delete")}
            </button>
          </div>
        </>
      )}
    </li>
  );
}
