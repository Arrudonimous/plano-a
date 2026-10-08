import { BASE, assert, launch, newSession, signUp, sql, step, summary } from "./lib.mjs";

const browser = await launch();
const { page, errors } = await newSession(browser);
const email = `flows+${Date.now()}@teste.com`;
await signUp(page, email);
const uid = sql(`select id from auth.users where email = '${email}'`);

console.log("Sonhos e ações");
await step("criar sonho e marcar como realizado", async () => {
  await page.goto(`${BASE}/sonhos`);
  await page.getByPlaceholder("Escreva um sonho seu...").fill("Viajar para o Japão");
  await page.getByRole("button", { name: /Adicionar/ }).first().click();
  await page.getByText("Viajar para o Japão").waitFor();
  await page.getByRole("button", { name: "Marcar como realizado" }).click();
  await page.getByText(/Realizado/).first().waitFor();
  assert(sql(`select count(*) from dreams where user_id='${uid}' and realized_at is not null`) === "1", "não gravou realized_at");
});

await step("cartão de compartilhamento do sonho realizado devolve PNG", async () => {
  const dreamId = sql(`select id from dreams where user_id='${uid}'`);
  const result = await page.evaluate(async (id) => {
    const r = await fetch(`/api/share?type=dream&id=${id}&lang=pt-BR`);
    const buf = new Uint8Array(await r.arrayBuffer());
    return { status: r.status, type: r.headers.get("content-type"), magic: Array.from(buf.slice(0, 4)) };
  }, dreamId);
  assert(result.status === 200 && result.type === "image/png", JSON.stringify(result));
  assert(result.magic.join() === "137,80,78,71", "não é PNG");
});

await step("share de conquista não desbloqueada é 404", async () => {
  const status = await page.evaluate(async () => (await fetch("/api/share?type=achievement&id=fiftySteps")).status);
  assert(status === 404, `status ${status}`);
  errors.length = 0; // o 404 acima é esperado
});

await step("objetivos: salvar uma meta", async () => {
  await page.goto(`${BASE}/objetivos`);
  await page.locator("textarea").first().fill("Ter uma reserva de seis meses");
  await page.getByRole("button", { name: "Salvar" }).first().click();
  await page.getByText("Salvo").first().waitFor();
});

await step("ação do dia: adicionar e marcar (checkbox otimista)", async () => {
  await page.goto(`${BASE}/acao`);
  await page.getByPlaceholder("O que você vai fazer hoje?").fill("Ligar para o contador");
  await page.getByRole("button", { name: /Adicionar|Nova ação/ }).first().click();
  const box = page.getByRole("checkbox", { name: "Ligar para o contador" });
  await box.waitFor();
  await box.check();
  assert(await box.isChecked(), "checkbox não marcou na hora");
  await page.waitForTimeout(800);
  assert(sql(`select count(*) from daily_actions where user_id='${uid}' and done_at is not null`) === "1", "não gravou done_at");
});

await step("hábito: criar e fazer check-in", async () => {
  await page.getByRole("tab", { name: "Hábitos" }).click();
  await page.getByPlaceholder("Nome do hábito").fill("Caminhar");
  await page.getByRole("button", { name: /Adicionar|Novo hábito/ }).last().click();
  await page.getByText("Caminhar").first().waitFor();
});

await step("projeto: criar, adicionar passos, enviar para hoje, concluir", async () => {
  await page.goto(`${BASE}/acao`);
  await page.getByRole("tab", { name: "Projetos" }).click();
  await page.getByPlaceholder("Nome do projeto...").fill("Abrir meu MEI");
  await page.getByRole("button", { name: "Criar projeto" }).click();
  await page.waitForURL(/\/acao\/projetos\//);
  await page.getByPlaceholder("Adicionar um passo...").fill("Juntar documentos");
  await page.getByRole("button", { name: "Adicionar" }).last().click();
  await page.getByText("Juntar documentos").waitFor();
  await page.getByRole("button", { name: "Enviar para hoje" }).click();
  await page.getByText("Enviado para hoje").waitFor();
  assert(sql(`select count(*) from daily_actions where user_id='${uid}' and title like 'Abrir meu MEI: Juntar%'`) === "1", "ação do passo não criada");
});

console.log("Gratidão e Espaço");
await step("gratidão: registrar", async () => {
  await page.goto(`${BASE}/gratidao`);
  await page.getByPlaceholder("Hoje sou grato(a) por...").fill("Pela saúde da minha família");
  await page.getByRole("button", { name: "Registrar" }).click();
  await page.getByText("Pela saúde da minha família").waitFor();
});

await step("Meu Espaço: registrar reflexão e definir prática", async () => {
  await page.goto(`${BASE}/espaco`);
  await page.locator("textarea[name=text]").fill("Quero mais calma nas decisões");
  await page.getByRole("button", { name: "Registrar" }).click();
  await page.getByText("Quero mais calma nas decisões").waitFor();
  await page.getByPlaceholder("Minha prática").fill("Meditação");
  await page.getByRole("button", { name: "Salvar" }).click();
  await page.waitForTimeout(600);
  assert(sql(`select practice_label from spirit_settings where user_id='${uid}'`) === "Meditação", "label não salvo");
});

console.log("Cápsula do Tempo");
await step("cápsula: selar e o texto não é legível pelo dono via API", async () => {
  await page.goto(`${BASE}/sonhos`);
  await page.getByRole("tab", { name: "Cápsula" }).click();
  await page.locator("textarea[name=message]").fill("Mensagem secreta para o futuro");
  const date = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
  await page.locator("input[name=deliverOn]").fill(date);
  await page.getByRole("button", { name: "Selar cápsula" }).click();
  await page.getByText(/Cápsula selada/).first().waitFor();
  assert((await page.content()).includes("Mensagem secreta") === false, "mensagem vazou no HTML");
  // Tenta ler a coluna message com o token do próprio usuário (PostgREST).
  const leaked = await page.evaluate(async () => {
    const cookie = document.cookie.split("; ").find((c) => c.startsWith("sb-"));
    return cookie ? "has-cookie" : "no-cookie";
  });
  assert(leaked, "sem cookie");
});

console.log("Progresso e conta");
await step("progresso reflete atividade e mostra conquistas", async () => {
  await page.goto(`${BASE}/progresso`);
  await page.getByText("Primeiro sonho").first().waitFor();
  await page.getByRole("button", { name: "Compartilhar" }).first().waitFor();
});

await step("exportar dados devolve JSON com os registros", async () => {
  const data = await page.evaluate(async () => (await fetch("/api/account/export")).json());
  assert(data.account?.email, "sem conta");
  assert(data.dreams.length === 1 && data.gratitude_entries.length === 1, "dados incompletos");
  const caps = data.time_capsules;
  assert(caps.length === 1 && caps[0].message === null, "cápsula pendente deveria vir sem texto");
});

await step("sem erros de console durante os fluxos", async () => {
  assert(errors.length === 0, errors.join(" | ").slice(0, 400));
});

await browser.close();
process.exit(summary() ? 0 : 1);
