"use client";

import { useActionState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { FinanceFormState } from "@/lib/actions/finance";
import { Button } from "@/components/ui/Button";

export function FinanceForm({
  action,
  submitLabel,
  showSaved = false,
  className = "space-y-2",
  children,
}: {
  action: (prev: FinanceFormState, formData: FormData) => Promise<FinanceFormState>;
  submitLabel: string;
  /** Mostra "Salvo" depois de salvar (útil quando a lista não muda). */
  showSaved?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const t = useTranslations("financeiro");
  const [state, formAction, pending] = useActionState<FinanceFormState, FormData>(action, { status: "idle" });

  return (
    <form action={formAction} className={className}>
      {children}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {submitLabel}
        </Button>
        {state.status === "invalid" && (
          <span role="alert" className="text-xs text-danger">
            {t("invalid")}
          </span>
        )}
        {showSaved && state.status === "saved" && (
          <span role="status" className="text-xs text-accent">
            {t("saved")}
          </span>
        )}
      </div>
    </form>
  );
}
