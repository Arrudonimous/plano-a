"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  isSupportedCurrency,
  isValidMonth,
  parseMoneyToCents,
} from "@/lib/finance/finance";

const MAX_NAME = 80;
const MAX_CENTS = 100_000_000_000;

export type FinanceFormState = { status: "idle" | "saved" | "invalid" };

const saved = (): FinanceFormState => ({ status: "saved" });
const invalid = (): FinanceFormState => ({ status: "invalid" });

async function getUserClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function revalidateFinance() {
  revalidatePath("/financeiro");
}

function readName(formData: FormData) {
  return String(formData.get("name") ?? "").trim().slice(0, MAX_NAME);
}

function readCurrency(formData: FormData): string | null {
  const value = String(formData.get("currency") ?? "").trim().toUpperCase();
  return isSupportedCurrency(value) ? value : null;
}

function readRate(formData: FormData): number | null {
  const raw = String(formData.get("rate") ?? "").trim().replace(",", ".");
  if (!raw) return 0;
  if (!/^\d{1,3}(\.\d{1,3})?$/.test(raw)) return null;
  const rate = Number(raw);
  return rate >= 0 && rate <= 100 ? rate : null;
}

function readMoney(formData: FormData, field: string) {
  return parseMoneyToCents(String(formData.get(field) ?? ""));
}

export async function addFinanceItem(
  kind: "income" | "expense",
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const name = readName(formData);
  const amount = readMoney(formData, "amount");
  const currency = readCurrency(formData);
  if (!name || !amount || !currency) return invalid();

  const { supabase, user } = await getUserClient();
  if (!user) return invalid();

  const { error } = await supabase
    .from("finance_items")
    .insert({ user_id: user.id, kind, name, amount_cents: amount, currency });
  if (error) return invalid();

  revalidateFinance();
  return saved();
}

export async function deleteFinanceItem(id: string) {
  const { supabase, user } = await getUserClient();
  if (!user) return;
  await supabase.from("finance_items").delete().eq("id", id);
  revalidateFinance();
}

export async function addDebt(
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const name = readName(formData);
  const balance = readMoney(formData, "balance");
  const rawPayment = String(formData.get("payment") ?? "").trim();
  const payment = rawPayment ? readMoney(formData, "payment") : 0;
  const currency = readCurrency(formData);
  const rate = readRate(formData);
  if (!name || balance === null || payment === null || !currency || rate === null) return invalid();

  const { supabase, user } = await getUserClient();
  if (!user) return invalid();

  const { error } = await supabase.from("finance_debts").insert({
    user_id: user.id,
    name,
    balance_cents: balance,
    monthly_payment_cents: payment,
    monthly_rate_pct: rate,
    currency,
  });
  if (error) return invalid();

  revalidateFinance();
  return saved();
}

export async function updateDebt(
  id: string,
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const balance = readMoney(formData, "balance");
  const rawPayment = String(formData.get("payment") ?? "").trim();
  const payment = rawPayment ? readMoney(formData, "payment") : 0;
  const rate = readRate(formData);
  if (balance === null || payment === null || rate === null) return invalid();

  const { supabase, user } = await getUserClient();
  if (!user) return invalid();

  const { error } = await supabase
    .from("finance_debts")
    .update({ balance_cents: balance, monthly_payment_cents: payment, monthly_rate_pct: rate })
    .eq("id", id);
  if (error) return invalid();

  revalidateFinance();
  return saved();
}

export async function deleteDebt(id: string) {
  const { supabase, user } = await getUserClient();
  if (!user) return;
  await supabase.from("finance_debts").delete().eq("id", id);
  revalidateFinance();
}

export async function saveReserve(
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const balance = String(formData.get("balance") ?? "").trim() ? readMoney(formData, "balance") : 0;
  const months = Number(formData.get("months"));
  if (balance === null || !Number.isInteger(months) || months < 1 || months > 24) return invalid();

  const { supabase, user } = await getUserClient();
  if (!user) return invalid();

  const { error } = await supabase.from("finance_reserve").upsert({
    user_id: user.id,
    balance_cents: balance,
    target_months: months,
    updated_at: new Date().toISOString(),
  });
  if (error) return invalid();

  revalidateFinance();
  return saved();
}

export async function addGoal(
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const name = readName(formData);
  const target = readMoney(formData, "target");
  const targetDate = String(formData.get("targetDate") ?? "").trim();
  const dreamId = String(formData.get("dreamId") ?? "").trim();
  const currency = readCurrency(formData);
  if (!name || !target || !currency) return invalid();

  const { supabase, user } = await getUserClient();
  if (!user) return invalid();

  const { error } = await supabase.from("finance_goals").insert({
    user_id: user.id,
    name,
    target_cents: target,
    target_date: /^\d{4}-\d{2}-\d{2}$/.test(targetDate) ? targetDate : null,
    dream_id: dreamId || null,
    currency,
  });
  if (error) return invalid();

  revalidateFinance();
  return saved();
}

/** Soma um valor guardado à meta (nunca passa do limite do banco). */
export async function addToGoal(
  id: string,
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const amount = readMoney(formData, "amount");
  if (!amount) return invalid();

  const { supabase, user } = await getUserClient();
  if (!user) return invalid();

  const { data: goal } = await supabase
    .from("finance_goals")
    .select("saved_cents")
    .eq("id", id)
    .single();
  if (!goal) return invalid();

  const { error } = await supabase
    .from("finance_goals")
    .update({ saved_cents: Math.min(goal.saved_cents + amount, MAX_CENTS) })
    .eq("id", id);
  if (error) return invalid();

  revalidateFinance();
  return saved();
}

export async function deleteGoal(id: string) {
  const { supabase, user } = await getUserClient();
  if (!user) return;
  await supabase.from("finance_goals").delete().eq("id", id);
  revalidateFinance();
}

export async function addTransaction(
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  // "type" = "<kind>:<categoria>", ex.: "expense:food".
  const [kind = "", category = ""] = String(formData.get("type") ?? "").split(":");
  const date = String(formData.get("date") ?? "").trim();
  const amount = readMoney(formData, "amount");
  const currency = readCurrency(formData);
  const description = String(formData.get("description") ?? "").trim().slice(0, 120);

  const categories: readonly string[] =
    kind === "income" ? INCOME_CATEGORIES : kind === "expense" ? EXPENSE_CATEGORIES : [];
  if (
    !categories.includes(category) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !isValidMonth(date.slice(0, 7)) ||
    !amount ||
    !currency
  ) {
    return invalid();
  }

  const { supabase, user } = await getUserClient();
  if (!user) return invalid();

  const { error } = await supabase.from("finance_transactions").insert({
    user_id: user.id,
    occurred_on: date,
    kind,
    category,
    description,
    amount_cents: amount,
    currency,
  });
  if (error) return invalid();

  revalidateFinance();
  return saved();
}

export async function deleteTransaction(id: string) {
  const { supabase, user } = await getUserClient();
  if (!user) return;
  await supabase.from("finance_transactions").delete().eq("id", id);
  revalidateFinance();
}
