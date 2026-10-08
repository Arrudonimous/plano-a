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
