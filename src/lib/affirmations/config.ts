export const AFFIRMATIONS_PER_DAY = 3;
export const AFFIRMATION_MAX_LENGTH = 200;
export const AFFIRMATIONS_HISTORY_DAYS = 30;
export const AFFIRMATIONS_AVOID_REPEAT_DAYS = 14;

const DEFAULT_MODEL = "claude-opus-5-5";
// Modelos que aceitam os mesmos parâmetros usados na geração (effort, saída
// estruturada e fallbacks). Outros valores caem no padrão.
const SUPPORTED_MODELS = [
  "claude-opus-5-5",
  "claude-opus-5",
  "claude-sonnet-5-5",
  "claude-fable-5-1",
];

function resolveModel() {
  const requested = process.env.AFFIRMATIONS_MODEL;
  if (!requested) return DEFAULT_MODEL;
  if (SUPPORTED_MODELS.includes(requested)) return requested;
  console.warn(
    `[affirmations] AFFIRMATIONS_MODEL="${requested}" não é suportado; usando ${DEFAULT_MODEL}`,
  );
  return DEFAULT_MODEL;
}

export const AFFIRMATIONS_MODEL = resolveModel();
