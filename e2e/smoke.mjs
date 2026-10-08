import { BASE, assert, launch, newSession, signUp, step, summary } from "./lib.mjs";

const browser = await launch();
const { page, errors } = await newSession(browser);
const email = `smoke+${Date.now()}@teste.com`;

console.log("Smoke");
await step("cadastro leva para Meu Dia", async () => {
  await signUp(page, email);
  assert(await page.locator("h1").first().isVisible(), "sem h1");
});

const routes = [
  "/hoje", "/sonhos", "/objetivos", "/acao", "/afirmacoes", "/gratidao", "/progresso", "/financeiro",
  "/jornadas", "/programas", "/mentalizacoes", "/espaco", "/planos", "/mais", "/configuracoes", "/privacidade", "/termos",
  "/en/hoje", "/es/hoje", "/es/financeiro", "/en/jornadas",
];
for (const route of routes) {
  await step(`GET ${route} abre sem erro`, async () => {
    errors.length = 0;
    const response = await page.goto(`${BASE}${route}`);
    assert(response?.status() === 200, `status ${response?.status()}`);
    await page.waitForLoadState("networkidle");
    assert(errors.length === 0, errors.join(" | ").slice(0, 300));
  });
}

await step("/admin é 404 para quem não é admin", async () => {
  const response = await page.goto(`${BASE}/admin`);
  assert(response?.status() === 404, `status ${response?.status()}`);
});

await browser.close();
process.exit(summary() ? 0 : 1);
