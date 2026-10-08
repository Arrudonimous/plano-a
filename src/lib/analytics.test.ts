import { test } from "node:test";
import assert from "node:assert/strict";
import { hashUser, sanitizeProps } from "./analyticsCore.ts";

test("hashUser é estável, depende do salt e não vaza o id", () => {
  const a = hashUser("user-1", "salt");
  assert.equal(a, hashUser("user-1", "salt"));
  assert.notEqual(a, hashUser("user-1", "outro"));
  assert.notEqual(a, hashUser("user-2", "salt"));
  assert.equal(a.includes("user-1"), false);
  assert.equal(a.length, 32);
});

test("sanitizeProps descarta texto longo, chaves ruins e tipos estranhos", () => {
  assert.deepEqual(
    sanitizeProps({ kind: "journey", count: 3, ok: true, long: "x".repeat(41), "Bad Key": "x" }),
    { kind: "journey", count: 3, ok: true },
  );
  assert.deepEqual(sanitizeProps(undefined), {});
});
