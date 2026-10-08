import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { SUPPORTED_CURRENCIES, type Rates } from "@/lib/finance/finance";

// API pública gratuita, sem chave (https://www.exchangerate-api.com/docs/free).
const RATES_URL = "https://open.er-api.com/v6/latest/USD";

/** Baixa as cotações do dia e grava só as moedas suportadas pelo app. */
export async function updateExchangeRates(): Promise<{ updated: number }> {
  const response = await fetch(RATES_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`cotações: HTTP ${response.status}`);
  const body = (await response.json()) as { result?: string; rates?: Record<string, number> };
  if (body.result !== "success" || !body.rates) throw new Error("cotações: resposta inesperada");

  const fetchedAt = new Date().toISOString();
  const rows = SUPPORTED_CURRENCIES.filter(
    (c) => c !== "USD" && typeof body.rates![c] === "number" && body.rates![c] > 0,
  ).map((currency) => ({ currency, per_usd: body.rates![currency], fetched_at: fetchedAt }));
  if (rows.length === 0) throw new Error("cotações: nenhuma moeda reconhecida");

  const { error } = await createAdminClient().from("exchange_rates").upsert(rows);
  if (error) throw new Error(error.message);
  return { updated: rows.length };
}

export async function loadRates(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<Rates> {
  const { data } = await supabase.from("exchange_rates").select("currency, per_usd");
  return Object.fromEntries((data ?? []).map((r) => [r.currency, Number(r.per_usd)]));
}
