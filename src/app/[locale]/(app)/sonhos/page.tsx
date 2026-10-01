import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { DREAM_BOARD_BUCKET } from "@/lib/dreamBoard";
import { DreamForm } from "@/components/dreams/DreamForm";
import { DreamCard } from "@/components/dreams/DreamCard";
import { SonhosTabs } from "@/components/dreams/SonhosTabs";
import { DreamBoard } from "@/components/dreams/board/DreamBoard";
import type { BoardItem } from "@/components/dreams/board/types";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export default async function SonhosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getTranslations("sonhos");

  const [{ data: dreams }, { data: boardItems }, { data: boardComments }] =
    await Promise.all([
      supabase
        .from("dreams")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("dream_board_items")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("dream_board_comments")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true }),
    ]);

  const imagePaths = (boardItems ?? [])
    .map((item) => item.image_path)
    .filter((path): path is string => Boolean(path));
  const signedUrlByPath = new Map<string, string>();
  if (imagePaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from(DREAM_BOARD_BUCKET)
      .createSignedUrls(imagePaths, SIGNED_URL_TTL_SECONDS);
    for (const entry of signed ?? []) {
      if (entry.path && entry.signedUrl) {
        signedUrlByPath.set(entry.path, entry.signedUrl);
      }
    }
  }

  const items: BoardItem[] = (boardItems ?? []).map((item) => ({
    ...item,
    signedUrl: item.image_path
      ? (signedUrlByPath.get(item.image_path) ?? null)
      : null,
    comments: (boardComments ?? []).filter((c) => c.item_id === item.id),
  }));

  const list = (
    <div className="space-y-6">
      <DreamForm />
      {dreams && dreams.length > 0 ? (
        <div className="space-y-3">
          {dreams.map((dream) => (
            <DreamCard key={dream.id} dream={dream} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <SonhosTabs listContent={list} boardContent={<DreamBoard items={items} />} />
    </div>
  );
}
