/** Idiomas editáveis no painel de conteúdo. */
export const CONTENT_LOCALES = ["pt-BR", "en", "es"] as const;

type Reader = { get(name: string): FormDataEntryValue | null };

/** Lê campos "<campo>.<idioma>" e devolve só os preenchidos: {"pt-BR": "...", "en": "..."}. */
export function readLocalized(form: Reader, field: string, maxLength = 20_000): Record<string, string> {
  const out: Record<string, string> = {};
  for (const locale of CONTENT_LOCALES) {
    const value = String(form.get(`${field}.${locale}`) ?? "").trim().slice(0, maxLength);
    if (value) out[locale] = value;
  }
  return out;
}

/**
 * Passos práticos: um textarea por idioma, um passo por linha. O passo N de cada
 * idioma forma um item: [{"pt-BR": "A", "en": "A'"}, ...].
 */
export function readLocalizedSteps(form: Reader, field: string, maxStepLength = 200) {
  const lines = Object.fromEntries(
    CONTENT_LOCALES.map((locale) => [
      locale,
      String(form.get(`${field}.${locale}`) ?? "")
        .split("\n")
        .map((line) => line.trim().slice(0, maxStepLength))
        .filter(Boolean),
    ]),
  );
  const count = Math.min(30, Math.max(0, ...Object.values(lines).map((l) => l.length)));
  return Array.from({ length: count }, (_, i) => {
    const item: Record<string, string> = {};
    for (const locale of CONTENT_LOCALES) {
      if (lines[locale][i]) item[locale] = lines[locale][i];
    }
    return item;
  }).filter((item) => Object.keys(item).length > 0);
}

/** Junta passos localizados de volta em linhas por idioma (para editar). */
export function stepsToLines(steps: unknown, locale: string): string {
  if (!Array.isArray(steps)) return "";
  return steps
    .map((step) => (step && typeof step === "object" ? (step as Record<string, string>)[locale] ?? "" : ""))
    .join("\n");
}

export function isValidSlug(value: string): boolean {
  return /^[a-z0-9-]{2,60}$/.test(value);
}
