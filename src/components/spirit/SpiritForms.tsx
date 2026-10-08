"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { addSpiritEntry, deleteSpiritEntry, saveSpiritLabel } from "@/lib/actions/spirit";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

const KINDS = ["reflection", "practice", "intention", "inspiration"] as const;

export function SpiritEntryForm({ defaultText = "" }: { defaultText?: string }) {
  const t = useTranslations("espaco");
  const [kind, setKind] = useState<(typeof KINDS)[number]>("reflection");

  return (
    <form action={addSpiritEntry} className="space-y-3">
      <input type="hidden" name="kind" value={kind} />
      <div role="radiogroup" aria-label={t("kindLabel")} className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={kind === k}
            onClick={() => setKind(k)}
            className={`rounded-full border px-3 py-1.5 text-xs ${
              kind === k
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground"
            }`}
          >
            {t(`kinds.${k}`)}
          </button>
        ))}
      </div>
      <Textarea
        name="text"
        rows={3}
        maxLength={2000}
        required
        defaultValue={defaultText}
        placeholder={t(`placeholders.${kind}`)}
      />
      <Button type="submit">{t("add")}</Button>
    </form>
  );
}

export function SpiritLabelForm({ defaultValue }: { defaultValue: string }) {
  const t = useTranslations("espaco");
  return (
    <form action={saveSpiritLabel} className="flex gap-2">
      <Input
        name="label"
        defaultValue={defaultValue}
        maxLength={60}
        placeholder={t("labelPlaceholder")}
        aria-label={t("labelTitle")}
      />
      <Button type="submit" variant="secondary" className="shrink-0">
        {t("save")}
      </Button>
    </form>
  );
}

export function SpiritEntryItem({ id, kind, text }: { id: string; kind: string; text: string }) {
  const t = useTranslations("espaco");
  const tCommon = useTranslations("common");
  return (
    <li className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="min-w-0">
        <p className="text-xs font-medium text-accent">{t(`kinds.${kind}`)}</p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
      </div>
      <button
        type="button"
        className="shrink-0 rounded-full px-2 py-1 text-xs text-muted-foreground hover:bg-danger/10 hover:text-danger"
        onClick={() => {
          if (window.confirm(t("confirmDelete"))) deleteSpiritEntry(id);
        }}
      >
        {tCommon("delete")}
      </button>
    </li>
  );
}
