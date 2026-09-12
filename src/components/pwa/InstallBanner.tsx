"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { Button } from "@/components/ui/Button";

const DISMISS_KEY = "plano-a:install-banner-dismissed";

export function InstallBanner() {
  const t = useTranslations("pwa");
  const { canInstallOnAndroid, canInstallOnIos, promptInstall } =
    useInstallPrompt();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Deferred to after mount so SSR output (dismissed=true) matches the
    // client's first paint before we read the real localStorage value.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (dismissed || (!canInstallOnAndroid && !canInstallOnIos)) return null;

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="mx-4 mt-4 flex items-start gap-3 rounded-2xl border border-border bg-surface-muted p-4">
      <span aria-hidden="true" className="text-2xl">
        📲
      </span>
      <div className="flex-1">
        <p className="text-sm font-medium">{t("installTitle")}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {canInstallOnIos ? t("iosInstallHint") : t("installBody")}
        </p>
        <div className="mt-3 flex gap-2">
          {canInstallOnAndroid && (
            <Button
              type="button"
              onClick={promptInstall}
              className="px-4 py-2 text-xs"
            >
              {t("installButton")}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={dismiss}
            className="px-4 py-2 text-xs"
          >
            {t("dismiss")}
          </Button>
        </div>
      </div>
    </div>
  );
}
