import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

/** IP do cliente atrás de proxy (Vercel preenche x-forwarded-for). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/**
 * Conta uma chamada na janela e diz se ainda está dentro do limite.
 * Falha aberta: se o banco/serviço não estiver disponível, não bloqueia pessoas.
 */
export async function rateLimit(key: string, max: number, windowSeconds: number): Promise<boolean> {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return true;
    const { data, error } = await createAdminClient().rpc("rate_limit_hit", {
      p_key: key,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) return true;
    return data !== false;
  } catch {
    return true;
  }
}
