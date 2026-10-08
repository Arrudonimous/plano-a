import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { mapSubscription, verifyStripeSignature } from "./stripeCore.ts";

const secret = "whsec_test";
const body = '{"id":"evt_1"}';
const sign = (t: number, payload = body, key = secret) =>
  createHmac("sha256", key).update(`${t}.${payload}`).digest("hex");

test("assinatura válida passa; corpo, segredo ou relógio errados falham", () => {
  const t = 1_700_000_000;
  const header = `t=${t},v1=${sign(t)}`;
  assert.equal(verifyStripeSignature(body, header, secret, t + 10), true);
  assert.equal(verifyStripeSignature(body + " ", header, secret, t + 10), false);
  assert.equal(verifyStripeSignature(body, header, "outro", t + 10), false);
  assert.equal(verifyStripeSignature(body, header, secret, t + 301), false);
  assert.equal(verifyStripeSignature(body, null, secret, t), false);
  assert.equal(verifyStripeSignature(body, "lixo", secret, t), false);
  assert.equal(verifyStripeSignature(body, `t=${t},v1=abc`, secret, t), false);
});

test("aceita várias assinaturas v1 (rotação de segredo)", () => {
  const t = 1_700_000_000;
  const header = `t=${t},v1=${sign(t, body, "antigo")},v1=${sign(t)}`;
  assert.equal(verifyStripeSignature(body, header, secret, t), true);
});

test("mapSubscription lê o fim do período nas duas formas da API", () => {
  const now = new Date("2026-01-01T00:00:00Z");
  const legacy = mapSubscription(
    { id: "sub_1", status: "active", customer: "cus_1", current_period_end: 1_800_000_000 },
    now,
  );
  assert.equal(legacy.current_period_end, new Date(1_800_000_000 * 1000).toISOString());
  const modern = mapSubscription(
    { id: "sub_2", status: "trialing", customer: { id: "cus_2" }, cancel_at_period_end: true, items: { data: [{ current_period_end: 1_800_000_100 }] } },
    now,
  );
  assert.equal(modern.provider_customer_id, "cus_2");
  assert.equal(modern.cancel_at_period_end, true);
  assert.equal(modern.current_period_end, new Date(1_800_000_100 * 1000).toISOString());
  assert.equal(mapSubscription({ id: "s", status: "canceled", customer: "c" }, now).current_period_end, null);
});
