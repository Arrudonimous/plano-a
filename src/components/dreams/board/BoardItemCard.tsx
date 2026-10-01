"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { deleteItem, updateItem } from "@/lib/actions/dreamBoard";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { CommentList } from "@/components/dreams/board/CommentList";
import type { BoardItem } from "@/components/dreams/board/types";

export function BoardItemCard({ item }: { item: BoardItem }) {
  const t = useTranslations("mural");
  const tCommon = useTranslations("common");
  const [editing, setEditing] = useState(false);
  const [showComments, setShowComments] = useState(false);

  return (
    <div className="mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      {item.kind === "image" && item.signedUrl && (
        <Image
          src={item.signedUrl}
          alt={item.content || t("imageAlt")}
          width={800}
          height={800}
          unoptimized
          className="h-auto w-full"
        />
      )}

      <div className="p-4">
        {editing ? (
          <form
            action={async (formData) => {
              await updateItem(item.id, formData);
              setEditing(false);
            }}
            className="space-y-2"
          >
            <Textarea
              name="content"
              defaultValue={item.content}
              rows={3}
              maxLength={2000}
              required={item.kind === "text"}
              autoFocus
            />
            <div className="flex gap-2">
              <Button type="submit" className="px-3 py-1.5 text-xs">
                {tCommon("save")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="px-3 py-1.5 text-xs"
                onClick={() => setEditing(false)}
              >
                {tCommon("cancel")}
              </Button>
            </div>
          </form>
        ) : (
          item.content && (
            <p
              className={`whitespace-pre-wrap leading-relaxed ${
                item.kind === "text" ? "text-base" : "text-sm"
              }`}
            >
              {item.content}
            </p>
          )
        )}

        {!editing && (
          <div className="mt-3 flex flex-wrap items-center gap-1 text-xs">
            <button
              type="button"
              className="rounded-full px-3 py-1.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
              aria-expanded={showComments}
              onClick={() => setShowComments((v) => !v)}
            >
              {t("commentsCount", { count: item.comments.length })}
            </button>
            <button
              type="button"
              className="rounded-full px-3 py-1.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
              onClick={() => setEditing(true)}
            >
              {tCommon("edit")}
            </button>
            <button
              type="button"
              className="rounded-full px-3 py-1.5 text-muted-foreground hover:bg-danger/10 hover:text-danger"
              onClick={() => {
                if (window.confirm(t("confirmDelete"))) {
                  deleteItem(item.id);
                }
              }}
            >
              {tCommon("delete")}
            </button>
          </div>
        )}

        {showComments && !editing && (
          <CommentList itemId={item.id} comments={item.comments} />
        )}
      </div>
    </div>
  );
}
