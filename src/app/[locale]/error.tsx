"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("erro");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <p className="text-sm text-muted-foreground">{t("body")}</p>
      {error.digest && <p className="text-xs text-muted-foreground">{t("code", { code: error.digest })}</p>}
      <div className="flex gap-3">
        <Button onClick={reset}>{t("retry")}</Button>
        <Link
          href="/hoje"
          className="inline-flex items-center rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-surface-muted"
        >
          {t("home")}
        </Link>
      </div>
    </main>
  );
}
