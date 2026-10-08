// Utilidades dos testes E2E (Playwright global em /opt/node22/lib/node_modules).
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

// Playwright: PLAYWRIGHT_MODULE (pasta de node_modules), o global do ambiente de dev ou o do projeto.
const require = createRequire(
  `${process.env.PLAYWRIGHT_MODULE ?? (existsSync("/opt/node22/lib/node_modules/playwright") ? "/opt/node22/lib/node_modules" : process.cwd() + "/node_modules")}/`,
);
const { chromium } = require("playwright");

const BUNDLED = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

/** Abre o navegador: CHROMIUM (caminho) > Chromium do ambiente de dev > o gerenciado pelo Playwright. */
export function launch() {
  const executablePath = process.env.CHROMIUM || (existsSync(BUNDLED) ? BUNDLED : undefined);
  return chromium.launch(executablePath ? { executablePath } : {});
}

export const BASE = process.env.E2E_BASE ?? "http://localhost:3000";
const DB = process.env.E2E_DB ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

export function sql(query) {
  return execFileSync("psql", [DB, "-X", "-q", "-t", "-A", "-c", query], { encoding: "utf8" }).trim();
}

let passed = 0;
const failures = [];
export async function step(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ok - ${name}`);
  } catch (err) {
    failures.push(name);
    console.log(`  FAIL - ${name}\n      ${String(err.message).split("\n")[0]}`);
  }
}
export function summary() {
  console.log(`\n${passed} ok, ${failures.length} falhas${failures.length ? `: ${failures.join("; ")}` : ""}`);
  return failures.length === 0;
}

export function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

/** Abre um contexto de celular e acumula erros de console/página (inclui violações de CSP). */
export async function newSession(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "pt-BR" });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(`http ${r.status()} ${r.request().method()} ${r.url().replace(BASE, "")}`);
  });
  return { context, page, errors };
}

export async function signUp(page, email, password = "senha-forte-123") {
  // Os testes criam muitas contas do mesmo IP: zera o rate limit (ele é testado à parte).
  sql("delete from rate_limits");
  await page.goto(`${BASE}/signup`);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/hoje/, { timeout: 15000 });
}
