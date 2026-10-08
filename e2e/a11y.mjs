// Acessibilidade (axe-core). Uso: AXE_PATH=/caminho/axe.min.js node e2e/a11y.mjs
import { readFileSync } from "node:fs";
import { BASE, launch, newSession, signUp, sql, step, summary, assert } from "./lib.mjs";

const axeSource = readFileSync(process.env.AXE_PATH ?? "node_modules/axe-core/axe.min.js", "utf8");
const browser = await launch();
const { page } = await newSession(browser);
const email = `a11y+${Date.now()}@teste.com`;
await signUp(page, email);
const uid = sql(`select id from auth.users where email='${email}'`);
sql(`insert into finance_items (user_id, kind, name, amount_cents) values ('${uid}','income','Salário',650000)`);
sql(`insert into dreams (user_id, description) values ('${uid}','Um sonho')`);

const routes = ["/hoje", "/sonhos", "/objetivos", "/acao", "/gratidao", "/progresso", "/financeiro", "/financeiro?aba=lancamentos", "/financeiro?aba=dividas", "/financeiro?aba=reserva",
  "/jornadas", "/conteudo/clt-para-negocio", "/espaco", "/planos", "/mais", "/configuracoes", "/privacidade", "/login", "/es/hoje"];
for (const route of routes) {
  await step(`axe ${route}`, async () => {
    if (route === "/login") await page.context().clearCookies();
    await page.goto(`${BASE}${route}`);
    await page.waitForLoadState("networkidle");
    await page.addScriptTag({ content: axeSource });
    const results = await page.evaluate(async () => {
      const r = await axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21aa", "best-practice"] });
      return r.violations.map((v) => ({ id: v.id, impact: v.impact, count: v.nodes.length, sample: v.nodes[0].html.slice(0, 140), help: v.help }));
    });
    const serious = results.filter((v) => ["serious", "critical", "moderate"].includes(v.impact));
    assert(serious.length === 0, serious.map((v) => `${v.id}(${v.impact}) x${v.count}: ${v.sample}`).join(" || "));
  });
}
await browser.close();
process.exit(summary() ? 0 : 1);
