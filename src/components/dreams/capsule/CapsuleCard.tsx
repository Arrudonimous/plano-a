"use client";

import { useFormatter, useTranslations } from "next-intl";
import { deleteCapsule } from "@/lib/actions/capsules";
import { CAPSULE_MAX_DELIVERY_ATTEMPTS } from "@/lib/capsules/config";
import { Card } from "@/components/ui/Card";
import type { CapsuleView } from "@/lib/capsules/load";

type Capsule = CapsuleView;

export function CapsuleCard({ capsule }: { capsule: Capsule }) {
  const t = useTranslations("capsula");
  const tCommon = useTranslations("common");
  const format = useFormatter();

  const day = (isoDate: string) =>
    format.dateTime(new Date(`${isoDate}T00:00:00Z`), {
      dateStyle: "long",
      timeZone: "UTC",
    });

  const delivered = Boolean(capsule.delivered_at);
  const stuck =
    !delivered && capsule.delivery_attempts >= CAPSULE_MAX_DELIVERY_ATTEMPTS;

  return (
    <Card>
      <p className="text-xs font-medium text-accent">
        {delivered
          ? t("deliveredOn", { date: day(capsule.delivered_at!.slice(0, 10)) })
          : stuck
            ? t("deliveryFailed")
            : t("sealedUntil", { date: day(capsule.deliver_on) })}
      </p>

      {delivered ? (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
          {capsule.message ?? t("deliveredNote")}
        </p>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          {t("sealedNote", { date: day(capsule.created_at.slice(0, 10)) })}
        </p>
      )}

      <div className="mt-3">
        <button
          type="button"
          className="rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-danger/10 hover:text-danger"
          onClick={() => {
            if (window.confirm(delivered ? t("confirmDeleteDelivered") : t("confirmDeletePending"))) {
              deleteCapsule(capsule.id);
            }
          }}
        >
          {delivered ? tCommon("delete") : t("cancelCapsule")}
        </button>
      </div>
    </Card>
  );
}
