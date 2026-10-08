import { useTranslations } from "next-intl";
import { SUPPORTED_CURRENCIES } from "@/lib/finance/finance";

export function CurrencySelect({ defaultValue, name = "currency" }: { defaultValue: string; name?: string }) {
  const t = useTranslations("financeiro");
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      aria-label={t("currencyLabel")}
      className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
    >
      {SUPPORTED_CURRENCIES.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
