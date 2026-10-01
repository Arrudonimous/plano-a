import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { AddStepForm } from "@/components/projects/AddStepForm";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { ProjectProgress } from "@/components/projects/ProjectProgress";
import { StepRow } from "@/components/projects/StepRow";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getTranslations("projetos");
  const tCommon = await getTranslations("common");

  const { data: project } = await supabase.from("projects").select("*").eq("id", id).single();
  if (!project) notFound();

  const [{ data: steps }, { data: dreams }] = await Promise.all([
    supabase
      .from("project_steps")
      .select("*")
      .eq("project_id", id)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("dreams")
      .select("id, description, realized_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
  ]);

  const dreamOptions = (dreams ?? [])
    .filter((d) => !d.realized_at || d.id === project.dream_id)
    .map(({ id: dreamId, description }) => ({ id: dreamId, description }));

  const all = steps ?? [];
  const done = all.filter((s) => s.done_at).length;
  const allDone = all.length > 0 && done === all.length;

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <Link href="/acao" className="text-xs text-muted-foreground hover:text-foreground">
        ← {tCommon("back")}
      </Link>

      <ProjectHeader project={project} dreams={dreamOptions} />

      <section className="space-y-2">
        <ProjectProgress done={done} total={all.length} />
        <p className="text-xs text-muted-foreground">
          {all.length === 0 ? t("noSteps") : t("progressOf", { done, total: all.length })}
        </p>
        {allDone && !project.completed_at && (
          <p className="text-sm text-accent">{t("allDone")}</p>
        )}
      </section>

      <section className="space-y-3">
        {all.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("stepsEmpty")}</p>
        ) : (
          <ul className="space-y-2">
            {all.map((step, index) => (
              <StepRow
                key={step.id}
                step={step}
                isFirst={index === 0}
                isLast={index === all.length - 1}
              />
            ))}
          </ul>
        )}
        <AddStepForm projectId={id} />
      </section>
    </div>
  );
}
