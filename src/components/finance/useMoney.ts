import { useFormatter } from "next-intl";

/**
 * Formata centavos no idioma atual. `currency` é a moeda padrão (a preferida do
 * perfil); passe outra no segundo argumento para valores em moeda própria.
 */
export function useMoney(currency: string) {
  const format = useFormatter();
  return (cents: number, override?: string) =>
    format.number(cents / 100, {
      style: "currency",
      currency: override ?? currency,
      maximumFractionDigits: 2,
    });
}
