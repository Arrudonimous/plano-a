// Garante que todos os arquivos em messages/ têm exatamente as mesmas chaves e os
// mesmos argumentos ICU ({nome}, {count, plural...}, <tag>) do pt-BR. O tsc não
// detecta chave ausente nem placeholder trocado.
import { readFileSync, readdirSync } from "node:fs";

const dir = new URL("../messages/", import.meta.url);

function flat(object, prefix = "") {
  return Object.entries(object).flatMap(([key, value]) =>
    value && typeof value === "object" ? flat(value, `${prefix}${key}.`) : [[`${prefix}${key}`, value]],
  );
}

/**
 * Nomes de argumentos e tags de uma mensagem ICU, ordenados e sem repetição.
 * Entende plural/select: o texto dentro de cada ramo não conta como argumento.
 */
function placeholders(message) {
  const names = new Set();

  // Lê o corpo de um ramo/argumento a partir de `i` (logo após "{") até o "}" que fecha.
  function walk(i) {
    while (i < message.length && message[i] !== "}") {
      if (message[i] === "{") i = argument(i + 1);
      else i++;
    }
    return i + 1;
  }

  function argument(i) {
    let name = "";
    while (i < message.length && !",}".includes(message[i])) name += message[i++];
    names.add(name.trim());
    if (message[i] === "}") return i + 1;
    // "{nome, plural|select|number..., ..." — pula o tipo e lê os ramos "seletor {texto}".
    i++;
    let type = "";
    while (i < message.length && !",}".includes(message[i])) type += message[i++];
    if (message[i] === "}") return i + 1;
    i++;
    if (!/^\s*(plural|select|selectordinal)\s*$/.test(type)) {
      while (i < message.length && message[i] !== "}") i++;
      return i + 1;
    }
    while (i < message.length && message[i] !== "}") {
      if (message[i] === "{") i = walk(i + 1);
      else i++;
    }
    return i + 1;
  }

  for (let i = 0; i < message.length; ) {
    if (message[i] === "{") i = argument(i + 1);
    else i++;
  }
  for (const m of message.matchAll(/<\/?([A-Za-z]\w*)>/g)) names.add(`<${m[1]}>`);
  return [...names].sort().join(",");
}

const load = (file) => new Map(flat(JSON.parse(readFileSync(new URL(file, dir), "utf8"))));
const base = load("pt-BR.json");
let failed = false;

for (const file of readdirSync(dir).filter((f) => f.endsWith(".json") && f !== "pt-BR.json")) {
  const messages = load(file);
  const missing = [...base.keys()].filter((k) => !messages.has(k));
  const extra = [...messages.keys()].filter((k) => !base.has(k));
  const mismatched = [...base.keys()].filter(
    (k) => messages.has(k) && placeholders(String(base.get(k))) !== placeholders(String(messages.get(k))),
  );
  if (missing.length || extra.length || mismatched.length) {
    failed = true;
    console.error(
      `${file}: faltam ${missing.length} [${missing.slice(0, 8)}], sobram ${extra.length} [${extra.slice(0, 8)}], placeholders diferentes ${mismatched.length} [${mismatched.slice(0, 8)}]`,
    );
  }
}

if (failed) process.exit(1);
console.log(`Traduções OK (${base.size} chaves, ${readdirSync(dir).filter((f) => f.endsWith(".json")).length} idiomas).`);
