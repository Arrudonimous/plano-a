import { test } from "node:test";
import assert from "node:assert/strict";
import {
  goalPercent,
  monthlyForGoal,
  monthsToPayOff,
  parseMoneyToCents,
  summarize,
} from "./finance.ts";

test("parseMoneyToCents aceita formatos pt-BR e en", () => {
  assert.equal(parseMoneyToCents("1.234,56"), 123456);
  assert.equal(parseMoneyToCents("1234.56"), 123456);
  assert.equal(parseMoneyToCents("1,5"), 150);
  assert.equal(parseMoneyToCents("10"), 1000);
  assert.equal(parseMoneyToCents("R$ 2.500"), 250000);
  assert.equal(parseMoneyToCents("1,234.56"), 123456);
  assert.equal(parseMoneyToCents("0,99"), 99);
});

test("parseMoneyToCents rejeita vazio, negativo e lixo", () => {
  for (const bad of ["", "  ", "-5", "abc", "1,234,5678", "1,2,3", "99999999999999"]) {
    assert.equal(parseMoneyToCents(bad), null, bad);
  }
});

test("summarize calcula sobra, custo e reserva", () => {
  const s = summarize(
    [
      { kind: "income", amount_cents: 500000 },
      { kind: "expense", amount_cents: 200000 },
    ],
    [{ balance_cents: 1000000, monthly_payment_cents: 100000 }],
    { balance_cents: 450000, target_months: 6 },
  );
  assert.equal(s.surplus, 200000);
  assert.equal(s.monthlyCost, 300000);
  assert.equal(s.reserveTarget, 1800000);
  assert.equal(s.reserveMonths, 1.5);
  assert.equal(s.reservePercent, 25);
  assert.equal(s.debtBalance, 1000000);
});

test("summarize sem custos não divide por zero e sobra pode ser negativa", () => {
  const empty = summarize([], [], { balance_cents: 100, target_months: 6 });
  assert.equal(empty.reserveMonths, null);
  assert.equal(empty.reservePercent, null);
  const tight = summarize([{ kind: "income", amount_cents: 100 }, { kind: "expense", amount_cents: 300 }], [], {
    balance_cents: 0,
    target_months: 3,
  });
  assert.equal(tight.surplus, -200);
});

test("reservePercent é limitado a 100", () => {
  const s = summarize([{ kind: "expense", amount_cents: 100 }], [], { balance_cents: 99999, target_months: 6 });
  assert.equal(s.reservePercent, 100);
});

test("monthsToPayOff", () => {
  assert.equal(monthsToPayOff({ balance_cents: 1000, monthly_payment_cents: 300 }), 4);
  assert.equal(monthsToPayOff({ balance_cents: 0, monthly_payment_cents: 0 }), 0);
  assert.equal(monthsToPayOff({ balance_cents: 1000, monthly_payment_cents: 0 }), null);
});

test("goalPercent e monthlyForGoal", () => {
  assert.equal(goalPercent({ target_cents: 1000, saved_cents: 333 }), 33);
  assert.equal(goalPercent({ target_cents: 1000, saved_cents: 5000 }), 100);
  const goal = { target_cents: 120000, saved_cents: 0 };
  assert.equal(monthlyForGoal(goal, "2027-01-15", "2026-01-15"), 10000);
  assert.equal(monthlyForGoal(goal, "2026-01-20", "2026-01-15"), 120000);
  assert.equal(monthlyForGoal(goal, "2026-01-10", "2026-01-15"), null);
  assert.equal(monthlyForGoal(goal, null, "2026-01-15"), null);
  assert.equal(monthlyForGoal({ target_cents: 10, saved_cents: 10 }, "2027-01-01", "2026-01-01"), 0);
});

import {
  convertCents,
  isValidMonth,
  makeConverter,
  monthBounds,
  monthStats,
  payoffWithInterest,
  shiftMonth,
} from "./finance.ts";

test("convertCents usa USD como ponte e devolve null sem cotação", () => {
  const rates = { BRL: 5, EUR: 0.5 };
  assert.equal(convertCents(1000, "BRL", "BRL", rates), 1000);
  assert.equal(convertCents(500, "BRL", "USD", rates), 100);
  assert.equal(convertCents(100, "USD", "BRL", rates), 500);
  assert.equal(convertCents(500, "BRL", "EUR", rates), 50);
  assert.equal(convertCents(100, "USD", "XYZ", rates), null);
  assert.equal(convertCents(100, "XYZ", "USD", rates), null);
});

test("makeConverter marca valores sem cotação em vez de perdê-los", () => {
  const convert = makeConverter({ BRL: 5 }, "BRL");
  assert.deepEqual(convert(700, "BRL"), { cents: 700, missing: false });
  assert.deepEqual(convert(700, "JPY"), { cents: 700, missing: true });
  assert.deepEqual(convert(100, "USD"), { cents: 500, missing: false });
});

test("payoffWithInterest", () => {
  assert.deepEqual(payoffWithInterest(0, 0, 5), { months: 0, totalInterestCents: 0 });
  assert.equal(payoffWithInterest(1000, 0, 1), null);
  assert.deepEqual(payoffWithInterest(1000, 250, 0), { months: 4, totalInterestCents: 0 });
  const withInterest = payoffWithInterest(100000, 10000, 2);
  assert.ok(withInterest && withInterest.months > 10 && withInterest.totalInterestCents > 0);
  // parcela menor ou igual aos juros: nunca quita
  assert.equal(payoffWithInterest(100000, 2000, 2), null);
});

test("monthStats separa receita, despesa e categorias", () => {
  const s = monthStats([
    { kind: "income", category: "salary", amount_cents: 1000 },
    { kind: "expense", category: "food", amount_cents: 200 },
    { kind: "expense", category: "housing", amount_cents: 500 },
    { kind: "expense", category: "food", amount_cents: 100 },
  ]);
  assert.equal(s.balance, 200);
  assert.deepEqual(s.byCategory, [
    { category: "housing", cents: 500 },
    { category: "food", cents: 300 },
  ]);
});

test("meses: validação, deslocamento e limites", () => {
  assert.equal(isValidMonth("2026-12"), true);
  assert.equal(isValidMonth("2026-13"), false);
  assert.equal(isValidMonth("26-01"), false);
  assert.equal(shiftMonth("2026-01", -1), "2025-12");
  assert.equal(shiftMonth("2026-12", 1), "2027-01");
  assert.deepEqual(monthBounds("2028-02"), { start: "2028-02-01", end: "2028-02-29" });
});

import { parseRatesResponse } from "./finance.ts";

test("parseRatesResponse filtra moedas suportadas e valores válidos", () => {
  const rows = parseRatesResponse({
    result: "success",
    rates: { USD: 1, BRL: 5.4, EUR: 0.92, XYZ: 3, GBP: -1, JPY: "x", MXN: 17.1 },
  });
  assert.deepEqual(rows.map((r) => r.currency).sort(), ["BRL", "EUR", "MXN"]);
  assert.throws(() => parseRatesResponse({ result: "error" }), /inesperada/);
  assert.throws(() => parseRatesResponse(null), /inesperada/);
  assert.throws(() => parseRatesResponse({ result: "success", rates: { XYZ: 1 } }), /nenhuma moeda/);
});
