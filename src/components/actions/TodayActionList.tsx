"use client";

import { useTranslations } from "next-intl";
import { deleteDailyAction, toggleDailyActionDone } from "@/lib/actions/dailyActions";
import type { Database } from "@/lib/types/database.types";

type DailyAction = Database["public"]["Tables"]["daily_actions"]["Row"];

export function TodayActionList({ actions }: { actions: DailyAction[] }) {
  const t = useTranslations("acao");

  if (actions.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("emptyActions")}</p>;
  }

  return (
    <ul className="space-y-2">
      {actions.map((action) => {
        const done = Boolean(action.done_at);
        return (
          <li
            key={action.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"
          >
            <input
              type="checkbox"
              checked={done}
              onChange={(event) =>
                toggleDailyActionDone(action.id, event.target.checked)
              }
              className="size-4 accent-accent"
            />
            <span
              className={`flex-1 text-sm ${done ? "text-muted-foreground line-through" : ""}`}
            >
              {action.title}
            </span>
            <button
              type="button"
              onClick={() => deleteDailyAction(action.id)}
              className="text-xs text-muted-foreground hover:text-red-600"
              aria-label="delete"
            >
              ✕
            </button>
          </li>
        );
      })}
    </ul>
  );
}
