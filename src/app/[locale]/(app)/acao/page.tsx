import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { todayInTimeZone } from "@/lib/utils/dates";
import { AcaoTabs } from "@/components/actions/AcaoTabs";
import { QuickAddAction } from "@/components/actions/QuickAddAction";
import { TodayActionList } from "@/components/actions/TodayActionList";
import { NewHabitForm } from "@/components/habits/NewHabitForm";
import { HabitList } from "@/components/habits/HabitList";
import { NewProjectForm } from "@/components/projects/NewProjectForm";
import { ProjectList } from "@/components/projects/ProjectList";

export default async function AcaoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getTranslations("acao");

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user!.id)
    .single();

  const timezone = profile?.timezone ?? "America/Sao_Paulo";
  const today = todayInTimeZone(timezone);

  const [
    { data: actions },
    { data: habits },
    { data: checkins },
    { data: projects },
    { data: projectSteps },
  ] = await Promise.all([
      supabase
        .from("daily_actions")
        .select("*")
        .eq("user_id", user!.id)
        .eq("due_date", today)
        .order("created_at"),
      supabase
        .from("habits")
        .select("*")
        .eq("user_id", user!.id)
        .is("archived_at", null)
        .order("created_at"),
      supabase
        .from("habit_checkins")
        .select("habit_id, checkin_date")
        .eq("user_id", user!.id),
      supabase
        .from("projects")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false }),
      supabase.from("project_steps").select("project_id, done_at").eq("user_id", user!.id),
    ]);

  const checkinsByHabit = new Map<string, string[]>();
  for (const c of checkins ?? []) {
    const list = checkinsByHabit.get(c.habit_id) ?? [];
    list.push(c.checkin_date);
    checkinsByHabit.set(c.habit_id, list);
  }

  const habitsWithCheckins = (habits ?? []).map((habit) => ({
    habit,
    checkinDates: checkinsByHabit.get(habit.id) ?? [],
  }));

  const stepsByProject = new Map<string, { total: number; done: number }>();
  for (const step of projectSteps ?? []) {
    const entry = stepsByProject.get(step.project_id) ?? { total: 0, done: 0 };
    entry.total++;
    if (step.done_at) entry.done++;
    stepsByProject.set(step.project_id, entry);
  }
  const projectSummaries = (projects ?? [])
    .map((project) => ({ project, ...(stepsByProject.get(project.id) ?? { total: 0, done: 0 }) }))
    .sort((a, b) => Number(Boolean(a.project.completed_at)) - Number(Boolean(b.project.completed_at)));

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <AcaoTabs
        todayContent={
          <div className="space-y-4">
            <QuickAddAction />
            <TodayActionList actions={actions ?? []} />
          </div>
        }
        habitsContent={
          <div className="space-y-4">
            <NewHabitForm />
            <HabitList habits={habitsWithCheckins} today={today} />
          </div>
        }
        projectsContent={
          <div className="space-y-4">
            <NewProjectForm />
            <ProjectList projects={projectSummaries} />
          </div>
        }
      />
    </div>
  );
}
