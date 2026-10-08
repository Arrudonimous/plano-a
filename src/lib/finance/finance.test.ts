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
