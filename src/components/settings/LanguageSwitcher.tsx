"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { setPreferredLanguage } from "@/lib/actions/profile";

const LABELS: Record<AppLocale, string> = {
  "pt-BR": "Português (Brasil)",
  en: "English",
  es: "Español",
};

export function LanguageSwitcher() {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div role="group" className="flex flex-wrap gap-2">
      {routing.locales.map((loc) => {
        const active = loc === locale;
        return (
          <button
            key={loc}
            type="button"
            disabled={active}
            aria-current={active ? "true" : undefined}
            onClick={() => {
              // Guarda a preferência: e-mails da cápsula e afirmações seguem o idioma escolhido.
              void setPreferredLanguage(loc);
              router.replace(pathname, { locale: loc });
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:cursor-default ${
              active
                ? "bg-primary text-primary-foreground"
                : "bg-surface-muted text-foreground border border-border hover:bg-border/40"
            }`}
          >
            {LABELS[loc]}
          </button>
        );
      })}
    </div>
  );
}
