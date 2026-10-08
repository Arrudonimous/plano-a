"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { createCapsule, type CapsuleActionState } from "@/lib/actions/capsules";
import { CAPSULE_MAX_MESSAGE_LENGTH } from "@/lib/capsules/config";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

const initialState: CapsuleActionState = {};

export function CapsuleForm({
  minDate,
  maxDate,
  premium,
}: {
  minDate: string;
  maxDate: string;
  premium: boolean;
}) {
  const t = useTranslations("capsula");
  const [state, formAction, pending] = useActionState(createCapsule, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <p className="text-sm text-muted-foreground">{t("intro")}</p>
      <Textarea
        name="message"
        placeholder={t("messagePlaceholder")}
        rows={5}
        maxLength={CAPSULE_MAX_MESSAGE_LENGTH}
        required
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm text-muted-foreground">
          {t("deliverOn")}
          <Input
            type="date"
            name="deliverOn"
            min={minDate}
            max={maxDate}
            required
            className="mt-1"
          />
        </label>
        <Button type="submit" disabled={pending}>
          {pending ? t("sealing") : t("seal")}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {premium ? t("limitHintPremium") : t("limitHint")}{" "}
        {!premium && (
          <Link href="/planos" className="font-medium text-primary">
            {t("seePlans")}
          </Link>
        )}
      </p>
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.success && <p className="text-sm text-accent">{t("sealed")}</p>}
    </form>
  );
}
