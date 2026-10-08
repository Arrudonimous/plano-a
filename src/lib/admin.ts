import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Usuário e cliente se for administrador; null caso contrário (a RLS também exige). */
export async function getAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  return data ? { supabase, user } : null;
}

/** Para páginas: quem não é admin vê 404 (não revela que a área existe). */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) notFound();
  return admin;
}
