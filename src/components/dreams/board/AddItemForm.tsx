"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { createImageItem, createTextItem } from "@/lib/actions/dreamBoard";
import {
  DREAM_BOARD_BUCKET,
  IMAGE_MAX_DIMENSION,
  MAX_IMAGE_SOURCE_BYTES,
} from "@/lib/dreamBoard";
import { resizeToJpeg } from "@/lib/utils/image";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

export function AddItemForm() {
  const t = useTranslations("mural");
  const formRef = useRef<HTMLFormElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = String(new FormData(event.currentTarget).get("content") ?? "").trim();

    if (!file && !text) {
      setError(t("errorEmpty"));
      return;
    }
    if (file && !file.type.startsWith("image/")) {
      setError(t("errorInvalid"));
      return;
    }
    if (file && file.size > MAX_IMAGE_SOURCE_BYTES) {
      setError(t("errorTooBig"));
      return;
    }
    setError(null);

    startTransition(async () => {
      try {
        if (file) {
          const blob = await resizeToJpeg(file, IMAGE_MAX_DIMENSION);
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) throw new Error("no session");

          const path = `${user.id}/${crypto.randomUUID()}.jpg`;
          const { error: uploadError } = await supabase.storage
            .from(DREAM_BOARD_BUCKET)
            .upload(path, blob, { contentType: "image/jpeg" });
          if (uploadError) throw uploadError;

          await createImageItem(path, text);
        } else {
          const data = new FormData();
          data.set("content", text);
          await createTextItem(data);
        }
        formRef.current?.reset();
        setFile(null);
      } catch {
        setError(t("errorUpload"));
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3">
      <Textarea
        name="content"
        placeholder={t("placeholder")}
        rows={2}
        maxLength={2000}
      />
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center rounded-full border border-border bg-surface-muted px-4 py-2.5 text-sm font-medium focus-within:ring-2 focus-within:ring-primary hover:bg-border/40">
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setError(null);
            }}
          />
          {file ? t("changeImage") : t("addImage")}
        </label>
        {file && (
          <span className="min-w-0 max-w-[12rem] truncate text-xs text-muted-foreground">
            {file.name}
          </span>
        )}
        <Button type="submit" disabled={pending} className="ml-auto">
          {pending ? t("saving") : t("add")}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
