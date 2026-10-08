"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";

const MAX_BYTES = 50 * 1024 * 1024;

/** Campo "media_url": cola uma URL (YouTube/Vimeo/arquivo) ou envia um arquivo ao bucket privado. */
export function MediaUploader({ defaultValue }: { defaultValue: string }) {
  const t = useTranslations("admin");
  const [value, setValue] = useState(defaultValue);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");

  async function upload(file: File) {
    if (file.size > MAX_BYTES) {
      setStatus("error");
      return;
    }
    setStatus("uploading");
    const safeName = file.name.replace(/[^\w.-]+/g, "_").slice(-80);
    const path = `lessons/${crypto.randomUUID()}-${safeName}`;
    const { error } = await createClient().storage.from("content").upload(path, file, {
      contentType: file.type || undefined,
    });
    if (error) {
      setStatus("error");
      return;
    }
    setValue(`storage:${path}`);
    setStatus("done");
  }

  return (
    <div className="space-y-2">
      <Input
        name="media_url"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t("mediaPlaceholder")}
        aria-label={t("mediaLabel")}
      />
      <input
        type="file"
        accept="video/mp4,video/webm,audio/mpeg,audio/mp4,audio/webm"
        aria-label={t("mediaUpload")}
        className="block w-full text-xs text-muted-foreground"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) upload(file);
        }}
      />
      <p role="status" className="text-xs text-muted-foreground">
        {status === "uploading" && t("uploading")}
        {status === "done" && t("uploaded")}
        {status === "error" && <span className="text-danger">{t("uploadError")}</span>}
      </p>
    </div>
  );
}
