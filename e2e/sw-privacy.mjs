// O service worker não pode guardar dados pessoais no cache do aparelho.
import { BASE, assert, launch, newSession, signUp, step, summary } from "./lib.mjs";

const browser = await launch();
const { page } = await newSession(browser);
await signUp(page, `sw+${Date.now()}@teste.com`);

console.log("Service worker");
await step("registra o SW e, depois de navegar e exportar dados, o cache não tem HTML nem /api", async () => {
  await page.goto(`${BASE}/hoje`);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  for (const path of ["/sonhos", "/financeiro", "/configuracoes"]) {
    await page.goto(`${BASE}${path}`);
    await page.waitForLoadState("networkidle");
  }
  await page.evaluate(async () => { await fetch("/api/account/export"); });
  await page.waitForTimeout(1500);
  const cached = await page.evaluate(async () => {
    const urls = [];
    for (const name of await caches.keys()) {
      for (const req of await (await caches.open(name)).keys()) urls.push(new URL(req.url).pathname);
    }
    return urls;
  });
  const personal = cached.filter((p) => p.startsWith("/api/") || ["/hoje", "/sonhos", "/financeiro", "/configuracoes"].some((r) => p === r));
  assert(personal.length === 0, `no cache: ${personal.join(", ")}`);
});

await browser.close();
process.exit(summary() ? 0 : 1);
