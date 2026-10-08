// Arquivos "use server" só podem exportar funções async (tipos são apagados).
// O tsc e o build não detectam isso: a falha só aparece em runtime, ao importar a action.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

let failed = false;
for (const file of walk("src").filter((f) => /\.(ts|tsx)$/.test(f))) {
  const source = readFileSync(file, "utf8");
  if (!/^\s*["']use server["']/m.test(source.split("\n").slice(0, 3).join("\n"))) continue;
  for (const [i, line] of source.split("\n").entries()) {
    if (/^export\s+(const|let|var|class|enum)\b/.test(line) || /^export\s+default\s+(?!async\s+function)/.test(line)) {
      failed = true;
      console.error(`${file}:${i + 1}: arquivo "use server" só pode exportar funções async -> ${line.trim()}`);
    }
  }
}
if (failed) process.exit(1);
console.log('Arquivos "use server" OK.');
