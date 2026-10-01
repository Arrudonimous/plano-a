"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { generateTodaysAffirmations } from "@/lib/actions/affirmations";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function GenerateToday() {
  const t = useTranslations("afirmacoes");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const started = useRef(false);

  const run = useCallback(() => {
    setError(null);
    startTransition(async () => {
      const result = await generateTodaysAffirmations();
      if (result.error) setError(result.error);
    });
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    run();
  }, [run]);

  if (error) {
    return (
      <Card className="space-y-3">
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
        <Button variant="secondary" onClick={run} disabled={pending}>
          {t("retry")}
        </Button>
      </Card>
    );
  }

  return (
    <Card aria-busy="true" role="status">
      <p className="animate-pulse text-sm text-muted-foreground">{t("generating")}</p>
    </Card>
  );
}
