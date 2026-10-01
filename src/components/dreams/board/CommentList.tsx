"use client";

import { useTranslations } from "next-intl";
import { addComment, deleteComment } from "@/lib/actions/dreamBoard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { BoardComment } from "@/components/dreams/board/types";

export function CommentList({
  itemId,
  comments,
}: {
  itemId: string;
  comments: BoardComment[];
}) {
  const t = useTranslations("mural");
  const tCommon = useTranslations("common");

  return (
    <div className="mt-3 space-y-3 border-t border-border pt-3">
      {comments.length > 0 && (
        <ul className="space-y-2">
          {comments.map((comment) => (
            <li key={comment.id} className="text-sm">
              <p className="whitespace-pre-wrap">{comment.body}</p>
              <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{comment.created_at.slice(0, 10)}</span>
                <button
                  type="button"
                  className="hover:text-danger"
                  onClick={() => {
                    if (window.confirm(t("confirmDeleteComment"))) {
                      deleteComment(comment.id);
                    }
                  }}
                >
                  {tCommon("delete")}
                </button>
              </p>
            </li>
          ))}
        </ul>
      )}
      <form action={addComment.bind(null, itemId)} className="flex gap-2">
        <Input
          name="body"
          placeholder={t("commentPlaceholder")}
          maxLength={1000}
          required
        />
        <Button type="submit" variant="secondary" className="shrink-0 px-4">
          {t("comment")}
        </Button>
      </form>
    </div>
  );
}
