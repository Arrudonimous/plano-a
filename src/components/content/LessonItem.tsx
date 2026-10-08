"use client";

import { useOptimistic, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toggleLesson } from "@/lib/actions/content";
import { localized, localizedList, parseBody } from "@/lib/content/localized";
import type { LessonView } from "@/lib/content/load";
import { Watermark } from "@/components/content/Watermark";

function Player({ lesson, title }: { lesson: LessonView; title: string }) {
  const media = lesson.media;
  if (!media) return null;

  if (media.type === "youtube" || media.type === "vimeo") {
    return (
      <div className="aspect-video overflow-hidden rounded-xl bg-surface-muted">
        <iframe
          src={media.embedUrl}
          title={title}
          className="size-full"
          allow="fullscreen; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
        />
      </div>
    );
  }
  if (!lesson.playUrl) return null;
  return media.audio ? (
    <audio controls controlsList="nodownload" preload="none" src={lesson.playUrl} className="w-full" />
  ) : (
    <video controls controlsList="nodownload" disablePictureInPicture playsInline preload="metadata" src={lesson.playUrl} className="w-full rounded-xl bg-black" />
  );
}

export function LessonItem({
  lesson,
  index,
  canTrack,
  watermark,
}: {
  lesson: LessonView;
  index: number;
  /** Só rastreia progresso depois de iniciar o programa. */
  canTrack: boolean;
  /** Texto da marca d'água (e-mail) em conteúdo premium. */
  watermark?: string;
}) {
  const t = useTranslations("conteudo");
  const locale = useLocale();
  const [done, setDone] = useOptimistic(lesson.done);
  const [, startTransition] = useTransition();

  const title = localized(lesson.title, locale);
  const blocks = parseBody(localized(lesson.body, locale));
  const steps = localizedList(lesson.steps, locale);

  return (
    <li className="rounded-xl border border-border bg-surface">
      <details>
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
          <span
            aria-hidden="true"
            className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs ${
              done ? "bg-accent text-white" : "bg-surface-muted text-muted-foreground"
            }`}
          >
            {done ? "✓" : index + 1}
          </span>
          <span className="flex-1 text-sm font-medium">{title}</span>
          {lesson.duration_minutes && (
            <span className="text-xs text-muted-foreground">{t("minutes", { count: lesson.duration_minutes })}</span>
          )}
        </summary>
        <div className="border-t border-border">
        <WatermarkIf text={watermark}>
        <div className="space-y-3 px-4 py-4">
          <Player lesson={lesson} title={title} />
          {blocks.map((block, i) =>
            block.type === "p" ? (
              <p key={i} className="text-sm leading-relaxed">
                {block.text}
              </p>
            ) : (
              <ul key={i} className="list-disc space-y-1 pl-5 text-sm">
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ),
          )}
          {steps.length > 0 && (
            <div className="rounded-xl bg-surface-muted p-3">
              <p className="text-xs font-medium text-accent">{t("practice")}</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                {steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
          )}
          {canTrack ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={done}
                className="size-4 accent-accent"
                onChange={(event) => {
                  const checked = event.target.checked;
                  startTransition(async () => {
                    setDone(checked);
                    await toggleLesson(lesson.id, checked);
                  });
                }}
              />
              {t("markDone")}
            </label>
          ) : (
            <p className="text-xs text-muted-foreground">{t("startToTrack")}</p>
          )}
        </div>
        </WatermarkIf>
        </div>
      </details>
    </li>
  );
}

function WatermarkIf({ text, children }: { text?: string; children: React.ReactNode }) {
  return text ? <Watermark text={text}>{children}</Watermark> : <>{children}</>;
}
