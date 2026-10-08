/** Texto por idioma: {"pt-BR": "...", "en": "...", "es": "..."}. */
export type Localized = Record<string, string>;

const FALLBACK_ORDER = ["pt-BR", "en", "es"];

/** Texto no idioma pedido, com fallback para pt-BR, en, es e qualquer outro. */
export function localized(value: unknown, locale: string): string {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const map = value as Record<string, unknown>;
  for (const key of [locale, ...FALLBACK_ORDER, ...Object.keys(map)]) {
    const text = map[key];
    if (typeof text === "string" && text.trim()) return text;
  }
  return "";
}

/** Lista de textos por idioma (ex.: passos práticos de uma aula). */
export function localizedList(value: unknown, locale: string): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => localized(item, locale)).filter(Boolean);
}

/** Divide um corpo de aula em blocos: parágrafos e listas ("- item"). */
export type Block = { type: "p"; text: string } | { type: "ul"; items: string[] };

export function parseBody(text: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of text.split(/\n{2,}/)) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;
    if (lines.every((l) => l.startsWith("- "))) {
      blocks.push({ type: "ul", items: lines.map((l) => l.slice(2).trim()) });
    } else {
      blocks.push({ type: "p", text: lines.join(" ") });
    }
  }
  return blocks;
}
