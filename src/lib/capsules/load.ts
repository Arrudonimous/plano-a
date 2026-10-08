import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database.types";

type CapsuleRow = Database["public"]["Tables"]["time_capsules"]["Row"];

/** Cápsula como a interface a vê: o texto só existe depois de entregue. */
export type CapsuleView = Omit<CapsuleRow, "message"> & { message: string | null };

// "message" fica de fora de propósito (ver migration 0013).
const SAFE_COLUMNS =
  "id, user_id, deliver_on, retention_tier, claimed_at, delivered_at, delivery_attempts, delivery_error, created_at";

export async function loadCapsules(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<CapsuleView[]> {
  const { data } = await supabase
    .from("time_capsules")
    .select(SAFE_COLUMNS)
    .eq("user_id", userId)
    .order("deliver_on", { ascending: true });

  const capsules = (data ?? []) as unknown as Omit<CapsuleRow, "message">[];
  const deliveredIds = capsules.filter((c) => c.delivered_at).map((c) => c.id);

  const messages = new Map<string, string>();
  if (deliveredIds.length > 0) {
    try {
      const { data: rows } = await createAdminClient()
        .from("time_capsules")
        .select("id, message")
        .eq("user_id", userId)
        .in("id", deliveredIds)
        .not("delivered_at", "is", null);
      for (const row of rows ?? []) messages.set(row.id, row.message);
    } catch {
      // Sem service role configurada: mostra o cartão sem o texto.
    }
  }

  return capsules.map((c) => ({ ...c, message: messages.get(c.id) ?? null }));
}
