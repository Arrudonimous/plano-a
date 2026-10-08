/* eslint-disable @typescript-eslint/no-require-imports */
// Stub de fetch para o servidor Next (NODE_OPTIONS=--require ./e2e/stub-fetch.cjs):
// responde Resend, Stripe, Anthropic e cotações no formato real e registra as chamadas
// em /tmp/stub-calls.jsonl para os testes conferirem.
const fs = require("node:fs");
const realFetch = globalThis.fetch;
const LOG = "/tmp/stub-calls.jsonl";

function record(entry) {
  fs.appendFileSync(LOG, JSON.stringify(entry) + "\n");
}
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

globalThis.fetch = async (input, init = {}) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const u = new URL(url);
  const method = String(init.method || (typeof input === "object" && input.method) || "GET").toUpperCase();
  const body = typeof init.body === "string" ? init.body : init.body ? String(init.body) : "";
  const headers = Object.fromEntries(new Headers(init.headers ?? {}).entries());

  if (u.hostname === "api.resend.com") {
    record({ host: u.hostname, path: u.pathname, method, body, auth: Boolean(headers.authorization) });
    return json({ id: "email_stub" });
  }

  if (u.hostname === "api.stripe.com") {
    record({ host: u.hostname, path: u.pathname, method, body, auth: headers.authorization });
    if (u.pathname === "/v1/checkout/sessions") return json({ url: "http://localhost:3000/planos?ok=1" });
    if (u.pathname === "/v1/billing_portal/sessions") return json({ url: "http://localhost:3000/planos" });
    if (u.pathname.startsWith("/v1/prices/")) return json({ unit_amount: 2990, currency: "brl", recurring: { interval: "month" } });
    if (u.pathname.startsWith("/v1/subscriptions/") && method === "DELETE") return json({ status: "canceled" });
    if (u.pathname.startsWith("/v1/subscriptions/")) {
      const stub = JSON.parse(fs.readFileSync("/tmp/stub-sub.json", "utf8"));
      return json(stub);
    }
    return json({ error: { message: "stub: rota desconhecida" } }, 404);
  }

  if (u.hostname === "api.anthropic.com") {
    record({ host: u.hostname, path: u.pathname, method, body, headers: { beta: headers["anthropic-beta"], key: Boolean(headers["x-api-key"]) } });
    if (fs.existsSync("/tmp/stub-anthropic-fail")) return json({ type: "error", error: { type: "api_error", message: "stub falha" } }, 500);
    return json({
      id: "msg_stub", type: "message", role: "assistant", model: "stub", stop_reason: "end_turn", stop_sequence: null,
      content: [{ type: "text", text: JSON.stringify({ affirmations: ["Eu avanço um passo de cada vez.", "Meus sonhos merecem a minha atenção hoje.", "Escolho a constância em vez da pressa."] }) }],
      usage: { input_tokens: 10, output_tokens: 10 },
    });
  }

  if (u.hostname === "open.er-api.com") {
    record({ host: u.hostname, path: u.pathname, method });
    return json({ result: "success", rates: { USD: 1, BRL: 5.5, EUR: 0.9, GBP: 0.8, JPY: 150, MXN: 17, NOPE: 0 } });
  }

  return realFetch(input, init);
};
