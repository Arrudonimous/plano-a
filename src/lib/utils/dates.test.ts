import { test } from "node:test";
import assert from "node:assert/strict";
import { addDaysISO, dateInTimeZone, isValidTimeZone } from "./dates.ts";

test("isValidTimeZone", () => {
  assert.equal(isValidTimeZone("America/Sao_Paulo"), true);
  assert.equal(isValidTimeZone("UTC"), true);
  for (const bad of ["", "Marte/Olympus", "sao paulo", "<script>"]) assert.equal(isValidTimeZone(bad), false, bad);
});

test("dateInTimeZone respeita o fuso na virada do dia", () => {
  const instant = new Date("2026-03-01T02:30:00Z");
  assert.equal(dateInTimeZone(instant, "America/Sao_Paulo"), "2026-02-28");
  assert.equal(dateInTimeZone(instant, "Asia/Tokyo"), "2026-03-01");
});

test("addDaysISO atravessa mês e ano bissexto", () => {
  assert.equal(addDaysISO("2028-02-28", 2), "2028-03-01");
  assert.equal(addDaysISO("2026-12-31", 1), "2027-01-01");
  assert.equal(addDaysISO("2026-03-01", -1), "2026-02-28");
});
