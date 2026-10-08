// Ataques "de fora": usa o token do próprio usuário direto no PostgREST/Storage.
import { assert, sql, step, summary } from "./lib.mjs";

const API = "http://127.0.0.1:54321";
const ANON = process.env.E2E_ANON ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const stamp = Date.now();

async function register(email) {
  const r = await fetch(`${API}/auth/v1/signup`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "senha-forte-123" }),
  });
  const body = await r.json();
  return { token: body.access_token, id: body.user.id };
}
const rest = (token, path, init = {}) =>
  fetch(`${API}/rest/v1/${path}`, { ...init, headers: { apikey: ANON, Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) } });

const a = await register(`apia+${stamp}@teste.com`);
const b = await register(`apib+${stamp}@teste.com`);

console.log("PostgREST");
await step("cápsula: ler 'message' é negado, metadados são lidos", async () => {
  const insert = await rest(a.token, "time_capsules", {
    method: "POST",
    body: JSON.stringify({ user_id: a.id, message: "segredo", deliver_on: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10) }),
  });
  assert(insert.status === 201, `insert ${insert.status}`);
  const withMessage = await rest(a.token, "time_capsules?select=message");
  assert(withMessage.status >= 400, `select message devolveu ${withMessage.status}`);
  const star = await rest(a.token, "time_capsules?select=*");
  assert(star.status >= 400, `select * devolveu ${star.status}`);
  const meta = await rest(a.token, "time_capsules?select=id,deliver_on");
  assert(meta.status === 200 && (await meta.json()).length === 1, "metadados não lidos");
});

await step("B não lê nem altera dados de A", async () => {
  await rest(a.token, "dreams", { method: "POST", body: JSON.stringify({ user_id: a.id, description: "sonho de A" }) });
  const read = await (await rest(b.token, "dreams?select=*")).json();
  assert(read.length === 0, "B leu sonho de A");
  const dreamId = sql(`select id from dreams where user_id='${a.id}'`);
  await rest(b.token, `dreams?id=eq.${dreamId}`, { method: "DELETE" });
  assert(sql(`select count(*) from dreams where id='${dreamId}'`) === "1", "B apagou sonho de A");
});

await step("usuário não vira admin nem assinante via API", async () => {
  const adm = await rest(a.token, "admins", { method: "POST", body: JSON.stringify({ user_id: a.id }) });
  assert(adm.status >= 400, `admins ${adm.status}`);
  const sub = await rest(a.token, "subscriptions", { method: "POST", body: JSON.stringify({ user_id: a.id, status: "active" }) });
  assert(sub.status >= 400, `subscriptions ${sub.status}`);
  const own = await rest(a.token, `profiles?id=eq.${a.id}`, { method: "PATCH", body: JSON.stringify({ analytics_opt_in: true }), headers: { Prefer: "return=representation" } });
  assert(own.status === 200, "atualizar o próprio perfil deveria funcionar");
});

await step("analytics_events, rate_limits e cotações: sem acesso de escrita/leitura indevida", async () => {
  assert((await rest(a.token, "analytics_events?select=*")).status >= 400, "leu eventos");
  assert((await rest(a.token, "rate_limits?select=*")).status >= 400, "leu rate_limits");
  const fn = await rest(a.token, "rpc/rate_limit_hit", { method: "POST", body: JSON.stringify({ p_key: "x", p_max: 1, p_window_seconds: 60 }) });
  assert(fn.status >= 400, `rpc rate_limit_hit ${fn.status}`);
  const rates = await rest(a.token, "exchange_rates", { method: "POST", body: JSON.stringify({ currency: "EUR", per_usd: 1 }) });
  assert(rates.status >= 400, "escreveu cotação");
  const premium = await (await rest(a.token, "rpc/has_premium", { method: "POST", body: "{}" })).json();
  assert(premium === false, "has_premium deveria ser false");
});

console.log("Storage");
const upload = (token, bucket, path, type = "image/png") =>
  fetch(`${API}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: { apikey: ANON, Authorization: `Bearer ${token}`, "Content-Type": type },
    body: Buffer.from("fake-bytes"),
  });

await step("dream-board: só na própria pasta; B não lê a pasta de A", async () => {
  assert((await upload(a.token, "dream-board", `${a.id}/x.png`)).status === 200, "upload na própria pasta");
  assert((await upload(a.token, "dream-board", `${b.id}/x.png`)).status >= 400, "A escreveu na pasta de B");
  const read = await fetch(`${API}/storage/v1/object/authenticated/dream-board/${a.id}/x.png`, { headers: { apikey: ANON, Authorization: `Bearer ${b.token}` } });
  assert(read.status >= 400, `B leu arquivo de A (${read.status})`);
  const own = await fetch(`${API}/storage/v1/object/authenticated/dream-board/${a.id}/x.png`, { headers: { apikey: ANON, Authorization: `Bearer ${a.token}` } });
  assert(own.status === 200, `A não leu o próprio arquivo (${own.status})`);
});

await step("dream-board: tipo não permitido é recusado", async () => {
  const r = await upload(a.token, "dream-board", `${a.id}/y.exe`, "application/x-msdownload");
  assert(r.status >= 400, `status ${r.status}`);
});

await step("bucket content: não-admin não envia nem lê", async () => {
  assert((await upload(a.token, "content", `lessons/hack-${stamp}.mp4`, "video/mp4")).status >= 400, "não-admin enviou");
  sql(`insert into admins values ('${b.id}')`);
  const adminUpload = await upload(b.token, "content", `lessons/ok-${stamp}.mp4`, "video/mp4");
  assert(adminUpload.status === 200, `admin não conseguiu enviar (${adminUpload.status})`);
  const read = await fetch(`${API}/storage/v1/object/authenticated/content/lessons/ok-${stamp}.mp4`, { headers: { apikey: ANON, Authorization: `Bearer ${a.token}` } });
  assert(read.status >= 400, `não-admin leu mídia (${read.status})`);
  sql(`delete from admins where user_id='${b.id}'`);
});

process.exit(summary() ? 0 : 1);
