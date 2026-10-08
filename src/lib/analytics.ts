import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hashUser, sanitizeProps, type Props } from "@/lib/analyticsCore";

/**
 * Registra um evento de produto se (e só se) a pessoa deu consentimento.
 * Nunca lança erro: analytics não pode quebrar a ação do usuário.
 */
export async function track(event: string, props?: Props): Promise<void> {
  try {
    const salt = process.env.ANALYTICS_SALT;
    if (!salt) return;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("analytics_opt_in")
      .eq("id", user.id)
      .single();
    if (!profile?.analytics_opt_in) return;

    await createAdminClient()
      .from("analytics_events")
      .insert({ event, user_hash: hashUser(user.id, salt), props: sanitizeProps(props) });
  } catch {
    // ignorado de propósito
  }
}
