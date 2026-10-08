export interface FinanceItem {
  kind: string;
  amount_cents: number;
}

export interface FinanceDebt {
  balance_cents: number;
  monthly_payment_cents: number;
}

export interface FinanceGoal {
  target_cents: number;
  saved_cents: number;
}

export interface FinanceSummary {
  income: number;
  expenses: number;
  debtPayments: number;
  /** Renda − despesas − parcelas de dívidas. Pode ser negativa. */
  surplus: number;
  /** Custo mensal de vida (despesas + parcelas). */
  monthlyCost: number;
  debtBalance: number;
  /** Meta da reserva em centavos (meses × custo mensal). */
  reserveTarget: number;
  /** Quantos meses de custo a reserva cobre (1 casa decimal); null sem custo cadastrado. */
  reserveMonths: number | null;
  /** 0–100, limitado; null sem meta calculável. */
  reservePercent: number | null;
}

export function summarize(
  items: FinanceItem[],
  debts: FinanceDebt[],
  reserve: { balance_cents: number; target_months: number },
): FinanceSummary {
  const income = sum(items.filter((i) => i.kind === "income").map((i) => i.amount_cents));
  const expenses = sum(items.filter((i) => i.kind === "expense").map((i) => i.amount_cents));
  const debtPayments = sum(debts.map((d) => d.monthly_payment_cents));
  const monthlyCost = expenses + debtPayments;
  const reserveTarget = monthlyCost * reserve.target_months;

  return {
    income,
    expenses,
    debtPayments,
    surplus: income - monthlyCost,
    monthlyCost,
    debtBalance: sum(debts.map((d) => d.balance_cents)),
    reserveTarget,
    reserveMonths:
      monthlyCost > 0 ? Math.round((reserve.balance_cents / monthlyCost) * 10) / 10 : null,
    reservePercent:
      reserveTarget > 0
        ? Math.min(100, Math.floor((reserve.balance_cents / reserveTarget) * 100))
        : null,
  };
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/**
 * Meses para quitar uma dívida pagando só a parcela (sem juros: estimativa
 * otimista). null quando não há parcela; 0 quando já está quitada.
 */
export function monthsToPayOff(debt: FinanceDebt): number | null {
  if (debt.balance_cents <= 0) return 0;
  if (debt.monthly_payment_cents <= 0) return null;
  return Math.ceil(debt.balance_cents / debt.monthly_payment_cents);
}

export function goalPercent(goal: FinanceGoal): number {
  return Math.min(100, Math.floor((goal.saved_cents / goal.target_cents) * 100));
}

/** Quanto guardar por mês para chegar na meta até `targetDate` (YYYY-MM-DD). */
export function monthlyForGoal(goal: FinanceGoal, targetDate: string | null, today: string): number | null {
  if (!targetDate) return null;
  const remaining = goal.target_cents - goal.saved_cents;
  if (remaining <= 0) return 0;
  const [ty, tm, td] = targetDate.split("-").map(Number);
  const [y, m, d] = today.split("-").map(Number);
  let months = (ty - y) * 12 + (tm - m);
  if (td > d) months += 1; // mês parcial conta como mês
  if (months < 1) return null; // prazo já passou ou é este mês: sem sugestão
  return Math.ceil(remaining / months);
}

/**
 * Converte o texto digitado em centavos. Aceita "1.234,56", "1234.56",
 * "1,5", "10". Devolve null para vazio, negativo ou inválido.
 */
export function parseMoneyToCents(input: string): number | null {
  const text = input.trim().replace(/\s/g, "").replace(/^[^\d,.-]+/, "");
  if (!text || text.startsWith("-")) return null;

  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");
  const decimalSep = lastComma > lastDot ? "," : lastDot > lastComma ? "." : null;

  let integerPart = text;
  let decimalPart = "";
  if (decimalSep) {
    const at = text.lastIndexOf(decimalSep);
    const after = text.slice(at + 1);
    // "1.234" sem vírgula é milhar; só tratamos como decimal se houver 1–2 dígitos
    // depois do separador, ou se o separador é a vírgula.
    if (decimalSep === "," || after.length <= 2) {
      integerPart = text.slice(0, at);
      decimalPart = after;
      // "1,2,3": o separador decimal não pode aparecer duas vezes.
      if (integerPart.includes(decimalSep)) return null;
    }
  }
  integerPart = integerPart.replace(/[.,]/g, "");
  if (!/^\d*$/.test(integerPart) || !/^\d{0,2}$/.test(decimalPart)) return null;
  if (!integerPart && !decimalPart) return null;

  const cents = Number(integerPart || "0") * 100 + Number(decimalPart.padEnd(2, "0") || "0");
  return Number.isSafeInteger(cents) && cents <= 100_000_000_000 ? cents : null;
}

// ------------------------------------------------------------------ moedas

export const SUPPORTED_CURRENCIES = [
  "BRL", "USD", "EUR", "GBP", "ARS", "MXN", "CLP", "COP", "PEN", "UYU", "CAD", "AUD", "JPY", "CHF",
] as const;

export function isSupportedCurrency(value: string): boolean {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}

/** Cotações: unidades de cada moeda por 1 USD (USD = 1). */
export type Rates = Record<string, number>;

/**
 * Converte centavos entre moedas pela cotação em USD. Devolve null quando falta
 * a cotação de uma das moedas (o chamador decide o que mostrar).
 */
export function convertCents(cents: number, from: string, to: string, rates: Rates): number | null {
  if (from === to) return cents;
  const rateFrom = from === "USD" ? 1 : rates[from];
  const rateTo = to === "USD" ? 1 : rates[to];
  if (!rateFrom || !rateTo || rateFrom <= 0 || rateTo <= 0) return null;
  return Math.round((cents / rateFrom) * rateTo);
}

export interface Converted {
  /** Valor na moeda alvo; sem cotação, mantém o valor original e marca `missing`. */
  cents: number;
  missing: boolean;
}

export function makeConverter(rates: Rates, target: string) {
  return (cents: number, currency: string): Converted => {
    const converted = convertCents(cents, currency, target, rates);
    return converted === null ? { cents, missing: true } : { cents: converted, missing: false };
  };
}

// ------------------------------------------------------------------- dívidas

export interface PayoffEstimate {
  months: number;
  totalInterestCents: number;
}

const MAX_PAYOFF_MONTHS = 600;

/**
 * Simula a quitação pagando a parcela todo mês, com juros compostos mensais
 * (`ratePct` em % ao mês). null quando a parcela não cobre os juros (a dívida
 * nunca zera) ou passa de 50 anos; sem juros usa a divisão simples.
 */
export function payoffWithInterest(
  balanceCents: number,
  paymentCents: number,
  ratePct: number,
): PayoffEstimate | null {
  if (balanceCents <= 0) return { months: 0, totalInterestCents: 0 };
  if (paymentCents <= 0) return null;

  let balance = balanceCents;
  let interestTotal = 0;
  for (let months = 1; months <= MAX_PAYOFF_MONTHS; months++) {
    const interest = Math.round(balance * (ratePct / 100));
    balance += interest;
    interestTotal += interest;
    if (paymentCents >= balance) return { months, totalInterestCents: interestTotal };
    balance -= paymentCents;
    if (interest >= paymentCents) return null; // só cresce
  }
  return null;
}

// ---------------------------------------------------------------- lançamentos

export const EXPENSE_CATEGORIES = [
  "housing", "food", "transport", "health", "education", "leisure", "family", "debts", "other",
] as const;
export const INCOME_CATEGORIES = ["salary", "freelance", "investments", "other"] as const;

export interface TxLike {
  kind: string;
  category: string;
  amount_cents: number;
}

export interface MonthStats {
  income: number;
  expenses: number;
  balance: number;
  /** Despesas por categoria, da maior para a menor. */
  byCategory: { category: string; cents: number }[];
}

export function monthStats(transactions: TxLike[]): MonthStats {
  let income = 0;
  let expenses = 0;
  const byCategory = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.kind === "income") income += tx.amount_cents;
    else {
      expenses += tx.amount_cents;
      byCategory.set(tx.category, (byCategory.get(tx.category) ?? 0) + tx.amount_cents);
    }
  }
  return {
    income,
    expenses,
    balance: income - expenses,
    byCategory: [...byCategory.entries()]
      .map(([category, cents]) => ({ category, cents }))
      .sort((a, b) => b.cents - a.cents),
  };
}

/** YYYY-MM de uma data YYYY-MM-DD. */
export function monthOf(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function isValidMonth(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const index = y * 12 + (m - 1) + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

/** Primeiro e último dia (YYYY-MM-DD) de um mês YYYY-MM. */
export function monthBounds(month: string): { start: string; end: string } {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { start: `${month}-01`, end: `${month}-${String(last).padStart(2, "0")}` };
}
