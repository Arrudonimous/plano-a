"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DREAM_BOARD_BUCKET } from "@/lib/dreamBoard";

const MAX_TEXT = 2000;
const MAX_COMMENT = 1000;

async function getUserClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function createTextItem(formData: FormData) {
  const content = String(formData.get("content") ?? "").trim().slice(0, MAX_TEXT);
  if (!content) return;

  const { supabase, user } = await getUserClient();
  if (!user) return;

  await supabase
    .from("dream_board_items")
    .insert({ user_id: user.id, kind: "text", content });

  revalidatePath("/sonhos");
}

export async function createImageItem(imagePath: string, caption: string) {
  const { supabase, user } = await getUserClient();
  if (!user) return;

  // O upload já é restrito por RLS à pasta do usuário; isto impede que uma
  // linha do banco aponte para o arquivo de outra pessoa.
  if (!imagePath.startsWith(`${user.id}/`) || imagePath.includes("..")) return;

  await supabase.from("dream_board_items").insert({
    user_id: user.id,
    kind: "image",
    image_path: imagePath,
    content: caption.trim().slice(0, MAX_TEXT),
  });

  revalidatePath("/sonhos");
}

export async function updateItem(id: string, formData: FormData) {
  const content = String(formData.get("content") ?? "").trim().slice(0, MAX_TEXT);

  const { supabase, user } = await getUserClient();
  if (!user) return;

  const { data: item } = await supabase
    .from("dream_board_items")
    .select("kind")
    .eq("id", id)
    .single();
  if (!item || (item.kind === "text" && !content)) return;

  await supabase
    .from("dream_board_items")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/sonhos");
}

export async function deleteItem(id: string) {
  const { supabase, user } = await getUserClient();
  if (!user) return;

  const { data: item } = await supabase
    .from("dream_board_items")
    .select("image_path")
    .eq("id", id)
    .single();
  if (!item) return;

  await supabase.from("dream_board_items").delete().eq("id", id);
  if (item.image_path) {
    await supabase.storage.from(DREAM_BOARD_BUCKET).remove([item.image_path]);
  }

  revalidatePath("/sonhos");
}

export async function addComment(itemId: string, formData: FormData) {
  const body = String(formData.get("body") ?? "").trim().slice(0, MAX_COMMENT);
  if (!body) return;

  const { supabase, user } = await getUserClient();
  if (!user) return;

  await supabase
    .from("dream_board_comments")
    .insert({ item_id: itemId, user_id: user.id, body });

  revalidatePath("/sonhos");
}

export async function deleteComment(id: string) {
  const { supabase, user } = await getUserClient();
  if (!user) return;

  await supabase.from("dream_board_comments").delete().eq("id", id);
  revalidatePath("/sonhos");
}
