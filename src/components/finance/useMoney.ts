import { useFormatter } from "next-intl";

/** Formata centavos na moeda preferida do perfil, no idioma atual. */
export function useMoney(currency: string) {
  const format = useFormatter();
  return (cents: number) =>
    format.number(cents / 100, { style: "currency", currency, maximumFractionDigits: 2 });
}
