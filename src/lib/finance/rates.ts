import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { parseRatesResponse, type Rates } from "@/lib/finance/finance";

// API pública gratuita, sem chave (https://www.exchangerate-api.com/docs/free).
const RATES_URL = "https://open.er-api.com/v6/latest/USD";

/** Baixa as cotações do dia e grava só as moedas suportadas pelo app. */
export async function updateExchangeRates(): Promise<{ updated: number }> {
  const response = await fetch(RATES_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`cotações: HTTP ${response.status}`);
  const fetchedAt = new Date().toISOString();
  const rows = parseRatesResponse(await response.json()).map((row) => ({ ...row, fetched_at: fetchedAt }));

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
