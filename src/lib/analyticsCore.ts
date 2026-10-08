import { createHmac } from "node:crypto";

export type Props = Record<string, string | number | boolean>;

/** Pseudônimo estável do usuário. Sem ANALYTICS_SALT configurado, nada é registrado. */
export function hashUser(userId: string, salt: string): string {
  return createHmac("sha256", salt).update(userId).digest("hex").slice(0, 32);
}

/** Só aceita valores curtos e simples: nunca texto livre do usuário. */
export function sanitizeProps(props: Props | undefined): Props {
  const out: Props = {};
  for (const [key, value] of Object.entries(props ?? {}).slice(0, 8)) {
    if (!/^[a-z_]{1,30}$/.test(key)) continue;
    if (typeof value === "string" && value.length <= 40) out[key] = value;
    else if (typeof value === "number" || typeof value === "boolean") out[key] = value;
  }
  return out;
}

