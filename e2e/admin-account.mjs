import { createHmac } from "node:crypto";
import { BASE, assert, launch, newSession, signUp, sql, step, summary } from "./lib.mjs";

const browser = await launch();
const stamp = Date.now();

console.log("Admin e CMS");
const admin = await newSession(browser);
const adminEmail = `admin+${stamp}@teste.com`;
await signUp(admin.page, adminEmail);
const adminId = sql(`select id from auth.users where email = '${adminEmail}'`);

await step("antes de ser admin: /admin é 404 e /mais não mostra o painel", async () => {
  assert((await admin.page.goto(`${BASE}/admin`))?.status() === 404, "deveria ser 404");
  admin.errors.length = 0; // o 404 acima é esperado
  await admin.page.goto(`${BASE}/mais`);
  assert((await admin.page.locator("main").innerText()).includes("Painel de conteúdo") === false, "card admin visível");
});

await step("admin cria programa, aula com passos e mídia enviada ao Storage", async () => {
  sql(`insert into admins values ('${adminId}')`);
  await admin.page.goto(`${BASE}/admin`);
  await admin.page.getByPlaceholder("slug-do-conteudo").fill(`curso-${stamp}`);
  await admin.page.locator("input[name='title.pt-BR']").first().fill("Curso de Teste");
  await admin.page.getByRole("button", { name: "Criar" }).click();
  await admin.page.waitForURL(/\/admin\/programas\//);
  // publicar + resumo
  await admin.page.locator("textarea[name='summary.pt-BR']").fill("Resumo do curso");
  await admin.page.getByLabel("Publicado").check();
  await admin.page.getByRole("button", { name: "Salvar" }).first().click();
  await admin.page.waitForTimeout(800);
  // nova aula
  const form = admin.page.locator("form").last();
  await form.locator("input[name='title.pt-BR']").fill("Aula 1");
  await form.locator("textarea[name='body.pt-BR']").fill("Primeiro parágrafo.\n\n- item um\n- item dois");
  await form.locator("textarea[name='steps.pt-BR']").fill("Passo A\nPasso B");
  await form.locator("input[type=file]").setInputFiles({ name: "aula.mp4", mimeType: "video/mp4", buffer: Buffer.from(await (await import("node:fs")).promises.readFile("/tmp/fake.mp4")) });
  await admin.page.getByText("Arquivo enviado").waitFor({ timeout: 20000 });
  await form.getByRole("button", { name: "Salvar" }).click();
  await admin.page.waitForTimeout(1000);
  assert(sql(`select count(*) from program_lessons l join programs p on p.id=l.program_id where p.slug='curso-${stamp}' and l.media_url like 'storage:lessons/%'`) === "1", "aula sem mídia do storage");
  assert(sql(`select published from programs where slug='curso-${stamp}'`) === "t", "não publicou");
});

await step("usuário comum vê o curso e o vídeo tem URL assinada do Storage", async () => {
  const user = await newSession(browser);
  await signUp(user.page, `user+${stamp}@teste.com`);
  await user.page.goto(`${BASE}/programas`);
  await user.page.getByText("Curso de Teste").first().waitFor();
  await user.page.goto(`${BASE}/conteudo/curso-${stamp}`);
  await user.page.locator("summary", { hasText: "Aula 1" }).click();
  const src = await user.page.locator("video").getAttribute("src");
  assert(src && src.includes("/storage/v1/object/sign/content/lessons/"), `src inesperado: ${src}`);
  const status = await user.page.evaluate(async (u) => (await fetch(u)).status, src);
  assert(status === 200, `URL assinada devolveu ${status}`);
  await user.page.getByText("Passo A").waitFor();
  await user.context.close();
});

await step("usuário comum não consegue enviar arquivo ao bucket de conteúdo", async () => {
  const user = await newSession(browser);
  await signUp(user.page, `nouser+${stamp}@teste.com`);
  await user.page.goto(`${BASE}/hoje`);
  const result = await user.page.evaluate(async () => {
    const cookie = decodeURIComponent(document.cookie.split("; ").find((c) => c.startsWith("sb-")) ?? "");
    return cookie.length > 0;
  });
  assert(result, "sem sessão");
  await user.context.close();
});

console.log("Métricas e consentimento");
await step("consentimento ligado registra eventos; admin vê métricas", async () => {
  const s = await newSession(browser);
  await signUp(s.page, `track+${stamp}@teste.com`);
  await s.page.goto(`${BASE}/configuracoes`);
  await s.page.getByLabel(/Ajudar a melhorar o Plano A/).check();
  await s.page.waitForTimeout(800);
  await s.page.goto(`${BASE}/conteudo/do-sonho-a-acao`);
  await s.page.getByRole("button", { name: "Começar" }).click();
  await s.page.waitForTimeout(800);
  const events = sql(`select string_agg(event, ',' order by id) from analytics_events`);
  assert(events?.includes("program_started"), `eventos: ${events}`);
  // sem consentimento nada é gravado
  const before = Number(sql("select count(*) from analytics_events"));
  const s2 = await newSession(browser);
  await signUp(s2.page, `notrack+${stamp}@teste.com`);
  await s2.page.goto(`${BASE}/conteudo/do-sonho-a-acao`);
  await s2.page.getByRole("button", { name: "Começar" }).click();
  await s2.page.waitForTimeout(800);
  assert(Number(sql("select count(*) from analytics_events")) === before, "gravou sem consentimento");
  await admin.page.goto(`${BASE}/admin/metricas`);
  await admin.page.getByText("program_started").waitFor();
  assert(!sql("select user_hash from analytics_events limit 1").includes("@"), "hash vazando e-mail");
  await s.context.close(); await s2.context.close();
});

console.log("Mural, conta e segurança");
const victim = await newSession(browser);
const victimEmail = `victim+${stamp}@teste.com`;
await signUp(victim.page, victimEmail);
const victimId = sql(`select id from auth.users where email='${victimEmail}'`);

await step("mural: enviar imagem ao Storage e ver na lista", async () => {
  await victim.page.goto(`${BASE}/sonhos`);
  await victim.page.getByRole("tab", { name: "Mural" }).click();
  await victim.page.locator("input[type=file]").first().setInputFiles("/tmp/board.png");
  await victim.page.getByRole("button", { name: "Adicionar ao mural" }).click();
  await victim.page.locator("img[alt='Imagem do mural']").first().waitFor({ timeout: 20000 });
  assert(sql(`select count(*) from storage.objects where bucket_id='dream-board' and name like '${victimId}/%'`) === "1", "objeto não está no storage");
});

await step("login: 11 tentativas erradas disparam o rate limit", async () => {
  const s = await newSession(browser);
  let message = "";
  for (let i = 0; i < 12; i++) {
    await s.page.goto(`${BASE}/login`);
    await s.page.fill("#email", `ratelimit+${stamp}@teste.com`);
    await s.page.fill("#password", "errada");
    await s.page.click('button[type="submit"]');
    await s.page.waitForTimeout(350);
    message = await s.page.locator("form p.text-danger").innerText().catch(() => "");
    if (message.includes("Muitas tentativas")) break;
  }
  assert(message.includes("Muitas tentativas"), `mensagem: ${message}`);
  await s.context.close();
});

await step("fuso/moeda inválidos nas configurações são ignorados", async () => {
  await victim.page.goto(`${BASE}/configuracoes`);
  await victim.page.evaluate(() => {
    const tz = document.querySelector("#timezone");
    const opt = document.createElement("option"); opt.value = "Marte/Olympus"; opt.text = "x"; tz.appendChild(opt); tz.value = "Marte/Olympus";
  });
  await victim.page.getByRole("button", { name: "Salvar" }).first().click();
  await victim.page.waitForTimeout(800);
  assert(sql(`select timezone from profiles where id='${victimId}'`) !== "Marte/Olympus", "fuso inválido foi salvo");
});

await step("trocar idioma salva preferred_language", async () => {
  await victim.page.goto(`${BASE}/configuracoes`);
  await victim.page.getByRole("button", { name: "Español" }).click();
  await victim.page.waitForURL(/\/es\//);
  await victim.page.waitForTimeout(600);
  assert(sql(`select preferred_language from profiles where id='${victimId}'`) === "es", "idioma não salvo");
  await victim.page.goto(`${BASE}/hoje`);
});

await step("cron: sem segredo é 401; com segredo roda", async () => {
  const s = await newSession(browser);
  await s.page.goto(`${BASE}/login`);
  const noAuth = await s.page.evaluate(async () => (await fetch("/api/cron/deliver-capsules")).status);
  assert(noAuth === 401, `status ${noAuth}`);
  const res = await fetch(`${BASE}/api/cron/deliver-capsules`, { headers: { Authorization: "Bearer test-cron-secret" } });
  assert(res.status === 200, `cron ${res.status}`);
  await s.context.close();
});

await step("webhook da Stripe: assinatura inválida é 400; válida de evento irrelevante é aceita", async () => {
  const body = JSON.stringify({ type: "invoice.paid", data: { object: {} } });
  const bad = await fetch(`${BASE}/api/stripe/webhook`, { method: "POST", body, headers: { "stripe-signature": "t=1,v1=abc" } });
  assert(bad.status === 400, `status ${bad.status}`);
  const t = Math.floor(Date.now() / 1000);
  const sig = createHmac("sha256", "whsec_test").update(`${t}.${body}`).digest("hex");
  const ok = await fetch(`${BASE}/api/stripe/webhook`, { method: "POST", body, headers: { "stripe-signature": `t=${t},v1=${sig}` } });
  assert(ok.status === 200 && (await ok.json()).ignored === "invoice.paid", `status ${ok.status}`);
});

await step("excluir conta: confirmação errada não apaga; correta apaga tudo (inclui Storage)", async () => {
  sql(`insert into dreams (user_id, description) values ('${victimId}', 'sonho da vítima')`);
  await victim.page.goto(`${BASE}/configuracoes`);
  await victim.page.locator("#confirm-email").fill("errado@x.com");
  victim.page.once("dialog", (d) => d.accept());
  await victim.page.getByRole("button", { name: /Excluir minha conta|Eliminar mi cuenta/ }).click();
  await victim.page.getByText(/O e-mail digitado não confere|El correo escrito no coincide/).waitFor();
  assert(sql(`select count(*) from auth.users where id='${victimId}'`) === "1", "apagou com confirmação errada");
  await victim.page.locator("#confirm-email").fill(victimEmail);
  victim.page.once("dialog", (d) => d.accept());
  await victim.page.getByRole("button", { name: /Excluir minha conta|Eliminar mi cuenta/ }).click();
  await victim.page.waitForURL(/\/login/, { timeout: 20000 });
  assert(sql(`select count(*) from auth.users where id='${victimId}'`) === "0", "usuário ainda existe");
  assert(sql(`select count(*) from dreams where user_id='${victimId}'`) === "0", "sonhos não caíram em cascata");
  assert(sql(`select count(*) from dream_board_items where user_id='${victimId}'`) === "0", "mural não caiu em cascata");
  assert(sql(`select count(*) from storage.objects where bucket_id='dream-board' and name like '${victimId}/%'`) === "0", "arquivo do mural sobrou");
});

for (const [name, s] of [["admin", admin]]) {
  await step(`sem erros de console (${name})`, async () => {
    assert(s.errors.length === 0, s.errors.join(" | ").slice(0, 400));
  });
}

await browser.close();
process.exit(summary() ? 0 : 1);
