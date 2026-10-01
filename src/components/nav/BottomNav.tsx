"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import {
  ActionIcon,
  HomeIcon,
  SettingsIcon,
  StarIcon,
  TargetIcon,
} from "@/components/nav/NavIcons";

const ITEMS = [
  { href: "/hoje", labelKey: "meuDia", Icon: HomeIcon },
  { href: "/sonhos", labelKey: "sonhos", Icon: StarIcon },
  { href: "/objetivos", labelKey: "objetivos", Icon: TargetIcon },
  { href: "/acao", labelKey: "acao", Icon: ActionIcon },
  { href: "/configuracoes", labelKey: "configuracoes", Icon: SettingsIcon },
] as const;

export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 border-t border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <ul className="mx-auto flex max-w-2xl items-stretch justify-between px-2">
        {ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-1 px-2 py-3 text-xs transition-colors ${
                  isActive
                    ? "font-medium text-accent"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.Icon />
                {t(item.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
