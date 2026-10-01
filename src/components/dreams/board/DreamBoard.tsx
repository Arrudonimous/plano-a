import { useTranslations } from "next-intl";
import { AddItemForm } from "@/components/dreams/board/AddItemForm";
import { BoardItemCard } from "@/components/dreams/board/BoardItemCard";
import type { BoardItem } from "@/components/dreams/board/types";

export function DreamBoard({ items }: { items: BoardItem[] }) {
  const t = useTranslations("mural");

  return (
    <div className="space-y-6">
      <AddItemForm />
      {items.length > 0 ? (
        <div className="columns-1 gap-4 sm:columns-2">
          {items.map((item) => (
            <BoardItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      )}
    </div>
  );
}
