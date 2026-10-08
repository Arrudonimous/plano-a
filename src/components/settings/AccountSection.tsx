"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { deleteAccount, setAnalyticsConsent, type DeleteAccountState } from "@/lib/actions/profile";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export function AnalyticsToggle({ enabled }: { enabled: boolean }) {
  const t = useTranslations("settings");
  return (
    <label className="flex items-start gap-3 text-sm">
      <input
        type="checkbox"
        defaultChecked={enabled}
        className="mt-0.5 size-4 accent-accent"
        onChange={(event) => setAnalyticsConsent(event.target.checked)}
      />
      <span>
        {t("analyticsLabel")}
        <span className="block text-xs text-muted-foreground">{t("analyticsHint")}</span>
      </span>
    </label>
  );
}

export function DeleteAccountForm({ email }: { email: string }) {
  const t = useTranslations("settings");
  const [state, formAction, pending] = useActionState<DeleteAccountState, FormData>(deleteAccount, {});

  return (
    <Card className="space-y-3 border-danger/40">
      <h2 className="text-sm font-semibold text-danger">{t("deleteTitle")}</h2>
      <p className="text-xs text-muted-foreground">{t("deleteBody")}</p>
      <form
        action={formAction}
        onSubmit={(event) => {
          if (!window.confirm(t("deleteConfirm"))) event.preventDefault();
        }}
        className="space-y-2"
      >
        <label className="block text-xs text-muted-foreground" htmlFor="confirm-email">
          {t("deleteType", { email })}
        </label>
        <Input id="confirm-email" name="confirm" autoComplete="off" required />
        <Button type="submit" variant="danger" disabled={pending} className="border border-danger/40">
          {t("deleteButton")}
        </Button>
        {state.error && (
          <p role="alert" className="text-xs text-danger">
            {t(`deleteError.${state.error}`)}
          </p>
        )}
      </form>
    </Card>
  );
}
