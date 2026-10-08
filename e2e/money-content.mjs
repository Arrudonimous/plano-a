import { BASE, assert, launch, newSession, signUp, sql, step, summary } from "./lib.mjs";

const browser = await launch();
const { page, errors } = await newSession(browser);
const email = `money+${Date.now()}@teste.com`;
await signUp(page, email);
const uid = sql(`select id from auth.users where email = '${email}'`);

// Cotação fictícia para testar conversão (1 USD = 5 BRL).
sql(`insert into exchange_rates (currency, per_usd) values ('BRL', 5) on conflict (currency) do update set per_usd = 5`);

console.log("Financeiro");
await step("renda em BRL e despesa em USD (convertida)", async () => {
  await page.goto(`${BASE}/financeiro?aba=orcamento`);
  const forms = page.locator("form");
  // Renda
  await page.getByPlaceholder("Ex.: salário").fill("Salário");
  await page.getByPlaceholder("Valor mensal (ex.: 2.500,00)").first().fill("5.000,00");
  await page.getByRole("button", { name: "Adicionar" }).first().click();
  await page.locator("li", { hasText: "Salário" }).first().waitFor();
  // Despesa em USD: US$ 100 = R$ 500
  await page.getByPlaceholder("Ex.: aluguel").fill("Assinaturas");
  const expenseForm = forms.filter({ has: page.getByPlaceholder("Ex.: aluguel") });
  await expenseForm.getByPlaceholder("Valor mensal (ex.: 2.500,00)").fill("100");
  await expenseForm.locator("select[name=currency]").selectOption("USD");
  await expenseForm.getByRole("button", { name: "Adicionar" }).click();
  await page.locator("li", { hasText: "Assinaturas" }).first().waitFor();
  assert(sql(`select currency from finance_items where user_id='${uid}' and name='Assinaturas'`) === "USD", "moeda não gravada");
});

await step("resumo converte para a moeda preferida (sobra = 5000 - 500)", async () => {
  await page.goto(`${BASE}/financeiro`);
  const text = await page.locator("main").innerText();
  assert(/4\.500,00/.test(text), `sobra esperada R$ 4.500,00; texto: ${text.slice(0, 300)}`);
});

await step("lançamento do mês + previsto x registrado", async () => {
  await page.goto(`${BASE}/financeiro?aba=lancamentos`);
  await page.locator("select[name=type]").selectOption("expense:food");
  await page.getByPlaceholder("Descrição (opcional)").fill("Mercado");
  await page.locator('form input[name=amount]').last().fill("250,50");
  await page.getByRole("button", { name: "Registrar lançamento" }).click();
  await page.getByText("Mercado").first().waitFor();
  assert(sql(`select amount_cents from finance_transactions where user_id='${uid}'`) === "25050", "valor errado");
  assert((await page.locator("main").innerText()).includes("Alimentação"), "categoria ausente");
});

await step("dívida com juros mostra estimativa e total de juros", async () => {
  await page.goto(`${BASE}/financeiro?aba=dividas`);
  await page.getByPlaceholder("Ex.: cartão de crédito").fill("Cartão");
  await page.getByPlaceholder("Saldo devedor (ex.: 3.000,00)").fill("3000");
  await page.getByPlaceholder("Parcela mensal (opcional)").fill("500");
  await page.getByPlaceholder("Juros ao mês, % (opcional)").fill("3");
  await page.getByRole("button", { name: "Adicionar dívida" }).click();
  await page.getByText(/Juros estimados/).waitFor();
});

await step("meta financeira ligada a um sonho", async () => {
  await page.goto(`${BASE}/sonhos`);
  await page.getByPlaceholder("Escreva um sonho seu...").fill("Casa própria");
  await page.getByRole("button", { name: /Adicionar/ }).first().click();
  await page.getByText("Casa própria").first().waitFor();
  await page.goto(`${BASE}/financeiro?aba=reserva`);
  await page.getByPlaceholder("Ex.: viagem, entrada do apartamento").fill("Entrada");
  await page.getByPlaceholder("Valor da meta (ex.: 10.000,00)").fill("20000");
  await page.locator("select[name=dreamId]").selectOption({ label: "Casa própria" });
  await page.getByRole("button", { name: "Adicionar meta" }).click();
  await page.getByText(/Ligada ao sonho: Casa própria/).waitFor();
  await page.getByPlaceholder("Quanto guardou agora?").fill("5000");
  await page.getByRole("button", { name: "Registrar valor guardado" }).click();
  await page.getByText(/25%/).waitFor();
});

console.log("Jornadas e conteúdo");
await step("lista de jornadas traz CLT → Negócio (seed)", async () => {
  await page.goto(`${BASE}/jornadas`);
  await page.getByText("CLT → Negócio").waitFor();
});

await step("iniciar jornada, concluir aula e criar projeto com os passos", async () => {
  await page.goto(`${BASE}/conteudo/clt-para-negocio`);
  await page.getByRole("button", { name: "Começar" }).click();
  await page.getByRole("button", { name: "Criar projeto com os passos" }).waitFor();
  await page.locator("summary", { hasText: "Clareza: por que e para quê" }).click();
  await page.getByRole("checkbox", { name: "Marcar aula como concluída" }).first().check();
  await page.waitForTimeout(800);
  assert(sql(`select count(*) from lesson_progress where user_id='${uid}'`) === "1", "progresso não gravado");
  await page.getByRole("button", { name: "Criar projeto com os passos" }).click();
  await page.waitForURL(/\/acao\/projetos\//);
  const steps = Number(sql(`select count(*) from project_steps ps join projects p on p.id=ps.project_id where p.user_id='${uid}' and p.title='CLT → Negócio'`));
  assert(steps === 24, `esperava 24 passos (8 aulas x 3), veio ${steps}`);
});

await step("mentalização abre e mostra o texto guiado", async () => {
  await page.goto(`${BASE}/conteudo/mentalizacao-dia-do-sonho`);
  await page.locator("summary").first().click();
  await page.getByText(/Respire fundo três vezes/).waitFor();
});

await step("conteúdo premium aparece travado para quem não assina", async () => {
  sql("delete from programs where slug='vip-test'");
  sql(`insert into programs (slug, kind, title, summary, access, published) values ('vip-test','program','{"pt-BR":"Conteúdo VIP"}','{"pt-BR":"Só assinantes"}','premium',true) on conflict do nothing`);
  sql(`insert into program_lessons (program_id, position, title, body) select id, 0, '{"pt-BR":"Aula VIP"}', '{"pt-BR":"segredo"}' from programs where slug='vip-test'`);
  await page.goto(`${BASE}/conteudo/vip-test`);
  await page.getByText("Conteúdo exclusivo para assinantes").waitFor();
  assert((await page.content()).includes("segredo") === false, "texto premium vazou");
  sql(`insert into subscriptions (user_id, status, current_period_end) values ('${uid}', 'active', now() + interval '30 days')`);
  await page.goto(`${BASE}/conteudo/vip-test`);
  await page.locator("summary", { hasText: "Aula VIP" }).click();
  await page.getByText("segredo").waitFor();
  assert((await page.content()).includes("data:image/svg+xml"), "marca d'água ausente");
});

await step("planos: assinante vê estado ativo", async () => {
  await page.goto(`${BASE}/planos`);
  await page.getByText("Você é assinante Premium").waitFor();
});

await step("cápsula estendida: assinante pode escolher data > 1 ano", async () => {
  await page.goto(`${BASE}/sonhos`);
  await page.getByRole("tab", { name: "Cápsula" }).click();
  await page.locator("textarea[name=message]").fill("Daqui a dois anos");
  const date = new Date(Date.now() + 730 * 86400000).toISOString().slice(0, 10);
  await page.locator("input[name=deliverOn]").fill(date);
  await page.getByRole("button", { name: "Selar cápsula" }).click();
  await page.getByText(/Cápsula selada/).first().waitFor();
  assert(sql(`select retention_tier from time_capsules where user_id='${uid}' and deliver_on > current_date + 400`) === "extended", "tier errado");
});

await step("sem erros de console", async () => {
  assert(errors.length === 0, errors.join(" | ").slice(0, 400));
});

await browser.close();
process.exit(summary() ? 0 : 1);
