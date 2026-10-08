"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { deleteDream, toggleDreamRealized } from "@/lib/actions/dreams";
import { ShareButton } from "@/components/share/ShareButton";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { Database } from "@/lib/types/database.types";

type Dream = Database["public"]["Tables"]["dreams"]["Row"];

export function DreamCard({ dream }: { dream: Dream }) {
  const t = useTranslations("sonhos");
  const tCommon = useTranslations("common");
  const isRealized = Boolean(dream.realized_at);

  return (
    <Card className={isRealized ? "opacity-70" : undefined}>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">
        {dream.description}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {dream.target_date && <span>🎯 {dream.target_date}</span>}
        {isRealized && (
          <span className="text-accent">
            ✨ {t("realizedOn")} {dream.realized_at?.slice(0, 10)}
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          className="px-3 py-1.5 text-xs"
          onClick={() => toggleDreamRealized(dream.id, !isRealized)}
        >
          {isRealized ? t("unmarkRealized") : t("markRealized")}
        </Button>
        {isRealized && <ShareButton type="dream" id={dream.id} fileName="plano-a-sonho-realizado" />}
        <Link
          href={`/sonhos/${dream.id}`}
          className="inline-flex items-center rounded-full border border-border px-3 py-1.5 text-xs hover:bg-surface-muted"
        >
          {tCommon("edit")}
        </Link>
        <Button
          variant="danger"
          className="px-3 py-1.5 text-xs"
          onClick={() => {
            if (window.confirm(t("confirmDelete"))) {
              deleteDream(dream.id);
            }
          }}
        >
          {tCommon("delete")}
        </Button>
      </div>
    </Card>
  );
}
