import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { localized } from "@/lib/content/localized";
import { loadLessons } from "@/lib/content/load";
import { LessonItem } from "@/components/content/LessonItem";
import { JourneyProjectButton, StartButton } from "@/components/content/ProgramActions";
import { Card } from "@/components/ui/Card";

const BACK = { program: "/programas", journey: "/jornadas", meditation: "/mentalizacoes" } as const;

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getTranslations("conteudo");
  const tCommon = await getTranslations("common");
  const locale = await getLocale();

  const { data: program } = await supabase.from("programs").select("*").eq("slug", slug).maybeSingle();
  if (!program) notFound();

  const [lessons, { data: enrollment }] = await Promise.all([
    loadLessons(supabase, user!.id, program.id),
    supabase
      .from("program_enrollments")
      .select("project_id")
      .eq("user_id", user!.id)
      .eq("program_id", program.id)
      .maybeSingle(),
  ]);

  const enrolled = Boolean(enrollment);
  const locked = program.access === "premium" && lessons.length === 0;
  const done = lessons.filter((l) => l.done).length;
  const kind = program.kind as keyof typeof BACK;

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <Link href={BACK[kind] ?? "/programas"} className="text-xs text-muted-foreground hover:text-foreground">
        ← {tCommon("back")}
      </Link>

      <div>
        <h1 className="text-xl font-semibold">{localized(program.title, locale)}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{localized(program.summary, locale)}</p>
        {enrolled && lessons.length > 0 && (
          <p className="mt-2 text-xs font-medium text-accent">
            {t("progressOf", { done, total: lessons.length })}
          </p>
        )}
      </div>

      {locked ? (
        <Card className="space-y-2">
          <p className="text-sm font-semibold">{t("lockedTitle")}</p>
          <p className="text-sm text-muted-foreground">{t("lockedBody")}</p>
          <Link href="/planos" className="inline-block text-sm font-medium text-primary">
            {t("seePlans")} →
          </Link>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {!enrolled && <StartButton programId={program.id} />}
            {enrolled && program.kind === "journey" && (
              <JourneyProjectButton programId={program.id} hasProject={Boolean(enrollment?.project_id)} />
            )}
          </div>
          <ol className="space-y-2">
            {lessons.map((lesson, index) => (
              <LessonItem key={lesson.id} lesson={lesson} index={index} canTrack={enrolled} />
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
