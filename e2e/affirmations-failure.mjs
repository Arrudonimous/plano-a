import { writeFileSync, rmSync } from "node:fs";
import { BASE, assert, launch, newSession, signUp, sql, step, summary } from "./lib.mjs";

const browser = await launch();
const { page } = await newSession(browser);
const email = `affail+${Date.now()}@teste.com`;
await signUp(page, email);
const uid = sql(`select id from auth.users where email='${email}'`);

console.log("Afirmações: falha da API");
await step("falha do Claude mostra mensagem, não grava nada e permite tentar de novo", async () => {
  writeFileSync("/tmp/stub-anthropic-fail", "1");
  await page.goto(`${BASE}/afirmacoes`);
  await page.getByText(/Não foi possível preparar/).waitFor({ timeout: 40000 });
  assert(sql(`select count(*) from affirmations where user_id='${uid}'`) === "0", "gravou parcial");
  rmSync("/tmp/stub-anthropic-fail", { force: true });
  await page.getByRole("button", { name: "Tentar de novo" }).click();
  await page.getByText("Eu avanço um passo de cada vez.").waitFor({ timeout: 40000 });
  assert(sql(`select count(*) from affirmations where user_id='${uid}'`) === "3", "não gerou após retry");
});

await browser.close();
rmSync("/tmp/stub-anthropic-fail", { force: true });
process.exit(summary() ? 0 : 1);
