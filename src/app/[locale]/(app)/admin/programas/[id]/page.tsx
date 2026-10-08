import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/admin";
import { deleteProgram, saveLesson, updateProgram } from "@/lib/actions/admin";
import { CONTENT_LOCALES, stepsToLines } from "@/lib/content/form";
import { LocalizedFields } from "@/components/admin/LocalizedFields";
import { DeleteProgramButton, LessonControls } from "@/components/admin/LessonControls";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

const asMap = (value: unknown) =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, string>) : {};

export default async function AdminProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const t = await getTranslations("admin");
  const tCommon = await getTranslations("common");

  const { data: program } = await supabase.from("programs").select("*").eq("id", id).maybeSingle();
  if (!program) notFound();
  const { data: lessons } = await supabase
    .from("program_lessons")
    .select("*")
    .eq("program_id", id)
    .order("position")
    .order("created_at");

  const select = "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm";

  const lessonForm = (lesson: NonNullable<typeof lessons>[number] | null) => {
    return (
      <form action={saveLesson.bind(null, id, lesson?.id ?? null)} className="space-y-3">
        <LocalizedFields field="title" label={t("titleLabel")} values={asMap(lesson?.title)} maxLength={160} />
        <LocalizedFields field="body" label={t("bodyLabel")} values={asMap(lesson?.body)} multiline rows={6} />
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{t("mediaLabel")}</p>
          <MediaUploader defaultValue={lesson?.media_url ?? ""} />
        </div>
        <Input name="duration" type="number" min={1} max={600} defaultValue={lesson?.duration_minutes ?? ""} placeholder={t("duration")} aria-label={t("duration")} />
        <fieldset className="space-y-2">
          <legend className="text-xs font-medium text-muted-foreground">{t("stepsLabel")}</legend>
          {CONTENT_LOCALES.map((locale) => (
            <Textarea key={locale} name={`steps.${locale}`} rows={3} placeholder={`${locale} (${t("stepsHint")})`} aria-label={`${t("stepsLabel")} (${locale})`} defaultValue={stepsToLines(lesson?.steps, locale)} />
          ))}
        </fieldset>
        <Button type="submit">{tCommon("save")}</Button>
      </form>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <Link href="/admin" className="text-xs text-muted-foreground hover:text-foreground">
        ← {tCommon("back")}
      </Link>

      <Card>
        <form action={updateProgram.bind(null, id)} className="space-y-3">
          <Input name="slug" defaultValue={program.slug} pattern="[a-z0-9\-]{2,60}" required aria-label="slug" />
          <select name="kind" defaultValue={program.kind} className={select} aria-label={t("kind")}>
            {(["program", "journey", "meditation"] as const).map((k) => (
              <option key={k} value={k}>
                {t(`kinds.${k}`)}
              </option>
            ))}
          </select>
          <select name="access" defaultValue={program.access} className={select} aria-label={t("access")}>
            <option value="free">{t("free")}</option>
            <option value="premium">{t("premium")}</option>
          </select>
          <LocalizedFields field="title" label={t("titleLabel")} values={asMap(program.title)} maxLength={120} />
          <LocalizedFields field="summary" label={t("summaryLabel")} values={asMap(program.summary)} multiline rows={3} maxLength={600} />
          <Input name="position" type="number" defaultValue={program.position} aria-label={t("position")} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="published" defaultChecked={program.published} className="size-4 accent-accent" />
            {t("published")}
          </label>
          <div className="flex items-center justify-between">
            <Button type="submit">{tCommon("save")}</Button>
            <DeleteProgramButton action={deleteProgram.bind(null, id)} />
          </div>
        </form>
      </Card>

      <h2 className="text-sm font-semibold">{t("lessons")}</h2>
      <ul className="space-y-2">
        {(lessons ?? []).map((lesson, index) => (
          <li key={lesson.id} className="rounded-xl border border-border bg-surface">
            <details>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium">
                <span className="truncate">
                  {index + 1}. {asMap(lesson.title)["pt-BR"] || Object.values(asMap(lesson.title))[0]}
                </span>
                <LessonControls programId={id} lessonId={lesson.id} isFirst={index === 0} isLast={index === (lessons ?? []).length - 1} />
              </summary>
              <div className="border-t border-border p-4">
                {lessonForm(lesson)}
              </div>
            </details>
          </li>
        ))}
      </ul>

      <Card>
        <h3 className="mb-3 text-sm font-semibold">{t("newLesson")}</h3>
        {lessonForm(null)}
      </Card>
    </div>
  );
}
