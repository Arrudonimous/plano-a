import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ProjectProgress } from "@/components/projects/ProjectProgress";
import type { Database } from "@/lib/types/database.types";

type Project = Database["public"]["Tables"]["projects"]["Row"];

export interface ProjectSummary {
  project: Project;
  total: number;
  done: number;
}

export function ProjectList({ projects }: { projects: ProjectSummary[] }) {
  const t = useTranslations("projetos");
  const format = useFormatter();

  if (projects.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <ul className="space-y-2">
      {projects.map(({ project, total, done }) => (
        <li key={project.id}>
          <Link
            href={`/acao/projetos/${project.id}`}
            className="block rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:bg-surface-muted"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm font-medium">{project.title}</span>
              {project.completed_at && (
                <span className="shrink-0 text-xs font-medium text-accent">{t("completed")}</span>
              )}
            </div>
            <div className="mt-2">
              <ProjectProgress done={done} total={total} />
            </div>
            <p className="mt-1.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
              <span>{total === 0 ? t("noSteps") : t("progressOf", { done, total })}</span>
              {project.target_date && (
                <span>
                  {t("targetOn", {
                    date: format.dateTime(new Date(`${project.target_date}T00:00:00Z`), {
                      dateStyle: "medium",
                      timeZone: "UTC",
                    }),
                  })}
                </span>
              )}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
