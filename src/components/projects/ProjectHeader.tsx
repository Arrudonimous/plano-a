"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  deleteProject,
  toggleProjectCompleted,
  updateProject,
} from "@/lib/actions/projects";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import type { Database } from "@/lib/types/database.types";

type Project = Database["public"]["Tables"]["projects"]["Row"];

export interface DreamOption {
  id: string;
  description: string;
}

export function ProjectHeader({
  project,
  dreams,
}: {
  project: Project;
  dreams: DreamOption[];
}) {
  const t = useTranslations("projetos");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  const [editing, setEditing] = useState(false);
  const completed = Boolean(project.completed_at);
  const linkedDream = dreams.find((d) => d.id === project.dream_id);

  if (editing) {
    return (
      <form
        action={async (formData) => {
          await updateProject(project.id, formData);
          setEditing(false);
        }}
        className="space-y-3"
      >
        <Input name="title" defaultValue={project.title} maxLength={120} required />
        <Textarea
          name="description"
          defaultValue={project.description}
          placeholder={t("descriptionPlaceholder")}
          rows={3}
          maxLength={1000}
        />
        <label className="block text-sm text-muted-foreground">
          {t("targetDateLabel")}
          <Input type="date" name="targetDate" defaultValue={project.target_date ?? ""} className="mt-1" />
        </label>
        <label className="block text-sm text-muted-foreground">
          {t("linkedDream")}
          <select
            name="dreamId"
            defaultValue={project.dream_id ?? ""}
            className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="">{t("noDream")}</option>
            {dreams.map((dream) => (
              <option key={dream.id} value={dream.id}>
                {dream.description.length > 60 ? `${dream.description.slice(0, 60)}…` : dream.description}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <Button type="submit">{tCommon("save")}</Button>
          <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
            {tCommon("cancel")}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-xl font-semibold">{project.title}</h1>
        {completed && <p className="mt-1 text-xs font-medium text-accent">{t("completed")} ✨</p>}
      </div>

      {project.description && (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {project.description}
        </p>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {project.target_date && (
          <span>
            {t("targetOn", {
              date: format.dateTime(new Date(`${project.target_date}T00:00:00Z`), {
                dateStyle: "long",
                timeZone: "UTC",
              }),
            })}
          </span>
        )}
        {linkedDream && (
          <Link href="/sonhos" className="hover:text-foreground">
            {t("forDream", { dream: linkedDream.description.slice(0, 60) })}
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={completed ? "secondary" : "primary"}
          className="px-4 py-2 text-xs"
          onClick={() => toggleProjectCompleted(project.id, !completed)}
        >
          {completed ? t("reopen") : t("complete")}
        </Button>
        <Button variant="secondary" className="px-4 py-2 text-xs" onClick={() => setEditing(true)}>
          {tCommon("edit")}
        </Button>
        <Button
          variant="danger"
          className="px-4 py-2 text-xs"
          onClick={() => {
            if (window.confirm(t("confirmDeleteProject"))) deleteProject(project.id);
          }}
        >
          {tCommon("delete")}
        </Button>
      </div>
    </div>
  );
}
