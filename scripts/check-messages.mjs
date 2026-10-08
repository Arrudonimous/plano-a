// Garante que todos os arquivos em messages/ têm exatamente as mesmas chaves
// do pt-BR (tsc não detecta chave de tradução ausente).
import { readFileSync, readdirSync } from "node:fs";

const dir = new URL("../messages/", import.meta.url);

function flat(object, prefix = "") {
  return Object.entries(object).flatMap(([key, value]) =>
    value && typeof value === "object" ? flat(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  );
}

const load = (file) => new Set(flat(JSON.parse(readFileSync(new URL(file, dir), "utf8"))));
const base = load("pt-BR.json");
let failed = false;

for (const file of readdirSync(dir).filter((f) => f.endsWith(".json") && f !== "pt-BR.json")) {
  const keys = load(file);
  const missing = [...base].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !base.has(k));
  if (missing.length || extra.length) {
    failed = true;
    console.error(`${file}: faltam ${missing.length} [${missing.slice(0, 10)}], sobram ${extra.length} [${extra.slice(0, 10)}]`);
  }
}

if (failed) process.exit(1);
console.log(`Traduções OK (${base.size} chaves).`);
