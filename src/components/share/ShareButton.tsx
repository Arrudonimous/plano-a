"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

/** Gera o cartão e abre o compartilhamento nativo (ou baixa a imagem). */
export function ShareButton({
  type,
  id,
  fileName,
}: {
  type: "achievement" | "dream";
  id: string;
  fileName: string;
}) {
  const t = useTranslations("share");
  const locale = useLocale();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function share() {
    setBusy(true);
    setFailed(false);
    try {
      const response = await fetch(`/api/share?type=${type}&id=${encodeURIComponent(id)}&lang=${locale}`);
      if (!response.ok) throw new Error(String(response.status));
      const file = new File([await response.blob()], `${fileName}.png`, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: t("shareText") });
      } else {
        const href = URL.createObjectURL(file);
        const a = document.createElement("a");
        a.href = href;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(href);
      }
    } catch (err) {
      // Cancelar o diálogo de compartilhamento não é erro.
      if (!(err instanceof DOMException && err.name === "AbortError")) setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={share}
        disabled={busy}
        className="rounded-full px-2 py-1 text-xs font-medium text-primary hover:bg-surface-muted disabled:opacity-50"
      >
        {busy ? t("preparing") : t("share")}
      </button>
      {failed && (
        <span role="alert" className="text-xs text-danger">
          {t("error")}
        </span>
      )}
    </span>
  );
}
