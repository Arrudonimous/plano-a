"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseMoneyToCents } from "@/lib/finance/finance";

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
  if (!name || !amount) return invalid();

  const { supabase, user } = await getUserClient();
  if (!user) return invalid();

  const { error } = await supabase
    .from("finance_items")
    .insert({ user_id: user.id, kind, name, amount_cents: amount });
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
  if (!name || balance === null || payment === null) return invalid();

  const { supabase, user } = await getUserClient();
  if (!user) return invalid();

  const { error } = await supabase.from("finance_debts").insert({
    user_id: user.id,
    name,
    balance_cents: balance,
    monthly_payment_cents: payment,
  });
  if (error) return invalid();

  revalidateFinance();
  return saved();
}

export async function updateDebtBalance(
  id: string,
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const balance = readMoney(formData, "balance");
  if (balance === null) return invalid();

  const { supabase, user } = await getUserClient();
  if (!user) return invalid();

  const { error } = await supabase
    .from("finance_debts")
    .update({ balance_cents: balance })
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
  if (!name || !target) return invalid();

  const { supabase, user } = await getUserClient();
  if (!user) return invalid();

  const { error } = await supabase.from("finance_goals").insert({
    user_id: user.id,
    name,
    target_cents: target,
    target_date: /^\d{4}-\d{2}-\d{2}$/.test(targetDate) ? targetDate : null,
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
