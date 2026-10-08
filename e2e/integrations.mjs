import { createHmac } from "node:crypto";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { BASE, assert, launch, newSession, signUp, sql, step, summary } from "./lib.mjs";

const calls = () =>
  existsSync("/tmp/stub-calls.jsonl")
    ? readFileSync("/tmp/stub-calls.jsonl", "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l))
    : [];
const browser = await launch();
const stamp = Date.now();
const { page, errors } = await newSession(browser);
const email = `integ+${stamp}@teste.com`;
await signUp(page, email);
const uid = sql(`select id from auth.users where email='${email}'`);

console.log("Claude (afirmações)");
await step("primeira visita do dia gera 3 afirmações e a requisição tem os parâmetros certos", async () => {
  rmSync("/tmp/stub-calls.jsonl", { force: true });
  sql(`insert into dreams (user_id, description) values ('${uid}', 'Abrir <b>meu</b> negócio')`);
  await page.goto(`${BASE}/afirmacoes`);
  await page.getByText("Eu avanço um passo de cada vez.").waitFor({ timeout: 20000 });
  assert(sql(`select count(*) from affirmations where user_id='${uid}'`) === "3", "não gravou 3");
  const c = calls().filter((x) => x.host === "api.anthropic.com");
  assert(c.length === 1, `chamadas ao Claude: ${c.length}`);
  const body = JSON.parse(c[0].body);
  assert(body.model === "claude-opus-5-5", `modelo ${body.model}`);
  assert(body.output_config?.effort === "low" && body.output_config?.format?.type === "json_schema", "output_config");
  assert(body.thinking === undefined, "thinking não deveria ser enviado");
  assert(c[0].headers.beta?.includes("server-side-fallback-2026-07-01"), `beta header: ${c[0].headers.beta}`);
  assert(c[0].path === "/v1/messages", c[0].path);
  assert(body.messages[0].content.includes("Abrir <b>meu</b> negócio"), "sonho não foi no prompt");
  assert(body.messages[0].content.includes("<dados_da_pessoa>"), "bloco delimitado ausente");
});

await step("segunda visita no mesmo dia não chama o Claude de novo", async () => {
  rmSync("/tmp/stub-calls.jsonl", { force: true });
  await page.goto(`${BASE}/afirmacoes`);
  await page.getByText("Eu avanço um passo de cada vez.").waitFor();
  assert(calls().filter((x) => x.host === "api.anthropic.com").length === 0, "chamou de novo");
});

console.log("Resend (cápsula)");
await step("cápsula vencida é entregue por e-mail, com HTML escapado", async () => {
  rmSync("/tmp/stub-calls.jsonl", { force: true });
  sql(`insert into time_capsules (user_id, message, deliver_on) values ('${uid}', 'Olá <script>alert(1)</script> futuro', current_date - 1)`);
  const res = await fetch(`${BASE}/api/cron/deliver-capsules`, { headers: { Authorization: "Bearer test-cron-secret" } });
  const result = await res.json();
  assert(result.delivered >= 1, JSON.stringify(result));
  const mail = calls().find((x) => x.host === "api.resend.com");
  assert(mail, "sem chamada ao Resend");
  const payload = JSON.parse(mail.body);
  assert(payload.to === email, `to=${payload.to}`);
  assert(payload.html.includes("&lt;script&gt;") && !payload.html.includes("<script>"), "HTML não escapado");
  assert(payload.text.includes("Olá <script>alert(1)</script> futuro"), "texto puro sem a mensagem");
  assert(sql(`select delivered_at is not null from time_capsules where user_id='${uid}'`) === "t", "não marcou entregue");
});

await step("após entregue, o dono vê o texto na interface (lido no servidor)", async () => {
  await page.goto(`${BASE}/sonhos`);
  await page.getByRole("tab", { name: "Cápsula" }).click();
  await page.getByText("Olá <script>alert(1)</script> futuro").waitFor();
});

await step("entrega é idempotente (rodar o cron de novo não reenvia)", async () => {
  rmSync("/tmp/stub-calls.jsonl", { force: true });
  await fetch(`${BASE}/api/cron/deliver-capsules`, { headers: { Authorization: "Bearer test-cron-secret" } });
  assert(calls().filter((x) => x.host === "api.resend.com").length === 0, "reenviou");
});

await step("cápsula com data futura não é entregue", async () => {
  sql(`insert into time_capsules (user_id, message, deliver_on) values ('${uid}', 'ainda não', current_date + 5)`);
  rmSync("/tmp/stub-calls.jsonl", { force: true });
  await fetch(`${BASE}/api/cron/deliver-capsules`, { headers: { Authorization: "Bearer test-cron-secret" } });
  assert(calls().filter((x) => x.host === "api.resend.com").length === 0, "enviou antes da hora");
});

console.log("Stripe");
await step("planos mostra preço vindo da Stripe e checkout redireciona", async () => {
  rmSync("/tmp/stub-calls.jsonl", { force: true });
  await page.goto(`${BASE}/planos`);
  await page.getByText(/R\$\s*29,90/).first().waitFor();
  await page.getByRole("button", { name: "Assinar" }).first().click();
  await page.waitForURL(/\/planos\?ok=1/);
  const c = calls().find((x) => x.path === "/v1/checkout/sessions");
  assert(c, "sem criação de sessão");
  const form = new URLSearchParams(c.body);
  assert(form.get("mode") === "subscription", "mode");
  assert(form.get("line_items[0][price]") === "price_m", "price");
  assert(form.get("client_reference_id") === uid, "client_reference_id");
  assert(form.get("subscription_data[metadata][user_id]") === uid, "metadata");
  assert(form.get("customer_email") === email, "customer_email");
  assert(c.auth === "Bearer sk_test_x", "auth");
});

await step("webhook checkout.session.completed ativa o Premium", async () => {
  writeFileSync("/tmp/stub-sub.json", JSON.stringify({
    id: "sub_test", status: "active", customer: "cus_test", cancel_at_period_end: false,
    items: { data: [{ current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400 }] }, metadata: { user_id: uid },
  }));
  const body = JSON.stringify({ type: "checkout.session.completed", data: { object: { mode: "subscription", subscription: "sub_test", client_reference_id: uid } } });
  const t = Math.floor(Date.now() / 1000);
  const sig = createHmac("sha256", "whsec_test").update(`${t}.${body}`).digest("hex");
  const res = await fetch(`${BASE}/api/stripe/webhook`, { method: "POST", body, headers: { "stripe-signature": `t=${t},v1=${sig}` } });
  assert(res.status === 200, `webhook ${res.status}: ${await res.text()}`);
  assert(sql(`select status||':'||provider_customer_id from subscriptions where user_id='${uid}'`) === "active:cus_test", "assinatura não gravada");
  await page.goto(`${BASE}/planos`);
  await page.getByText("Você é assinante Premium").waitFor();
});

await step("portal de assinatura abre", async () => {
  rmSync("/tmp/stub-calls.jsonl", { force: true });
  await page.getByRole("button", { name: "Gerenciar assinatura" }).click();
  for (let i = 0; i < 40 && !calls().some((x) => x.path === "/v1/billing_portal/sessions"); i++) await page.waitForTimeout(150);
  const c = calls().find((x) => x.path === "/v1/billing_portal/sessions");
  assert(c && new URLSearchParams(c.body).get("customer") === "cus_test", "portal sem customer");
});

await step("webhook de cancelamento tira o acesso", async () => {
  writeFileSync("/tmp/stub-sub.json", JSON.stringify({ id: "sub_test", status: "canceled", customer: "cus_test", items: { data: [{ current_period_end: Math.floor(Date.now() / 1000) - 10 }] }, metadata: { user_id: uid } }));
  const body = JSON.stringify({ type: "customer.subscription.deleted", data: { object: { id: "sub_test" } } });
  const t = Math.floor(Date.now() / 1000);
  const sig = createHmac("sha256", "whsec_test").update(`${t}.${body}`).digest("hex");
  const res = await fetch(`${BASE}/api/stripe/webhook`, { method: "POST", body, headers: { "stripe-signature": `t=${t},v1=${sig}` } });
  assert(res.status === 200, `webhook ${res.status}`);
  assert(sql(`select status from subscriptions where user_id='${uid}'`) === "canceled", "status não mudou");
  await page.goto(`${BASE}/planos`);
  await page.getByRole("button", { name: "Assinar" }).first().waitFor();
});

await step("excluir conta com assinatura ativa cancela na Stripe antes", async () => {
  sql(`update subscriptions set status='active', current_period_end = now() + interval '10 days' where user_id='${uid}'`);
  rmSync("/tmp/stub-calls.jsonl", { force: true });
  await page.goto(`${BASE}/configuracoes`);
  await page.locator("#confirm-email").fill(email);
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Excluir minha conta" }).click();
  await page.waitForURL(/\/login/, { timeout: 20000 });
  const del = calls().find((x) => x.method === "DELETE" && x.path === "/v1/subscriptions/sub_test");
  assert(del, "não cancelou a assinatura na Stripe");
  assert(sql(`select count(*) from auth.users where id='${uid}'`) === "0", "conta não excluída");
});

await step("sem erros de console", async () => {
  assert(errors.length === 0, errors.join(" | ").slice(0, 400));
});

await browser.close();
process.exit(summary() ? 0 : 1);
