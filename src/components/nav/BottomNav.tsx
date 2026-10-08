"use client";

import { useTranslations } from "next-intl";
import { MORE_HREFS } from "@/components/nav/modules";
import { Link, usePathname } from "@/i18n/navigation";
import {
  ActionIcon,
  HomeIcon,
  MoreIcon,
  StarIcon,
  TargetIcon,
} from "@/components/nav/NavIcons";

const ITEMS = [
  { href: "/hoje", labelKey: "meuDia", Icon: HomeIcon },
  { href: "/sonhos", labelKey: "sonhos", Icon: StarIcon },
  { href: "/objetivos", labelKey: "objetivos", Icon: TargetIcon },
  { href: "/acao", labelKey: "acao", Icon: ActionIcon },
  { href: "/mais", labelKey: "mais", Icon: MoreIcon },
] as const;

export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 border-t border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <ul className="mx-auto flex max-w-2xl items-stretch justify-between px-2">
        {ITEMS.map((item) => {
          const hrefs = item.href === "/mais" ? MORE_HREFS : [item.href];
          const isActive = hrefs.some(
            (href) => pathname === href || pathname.startsWith(`${href}/`),
          );
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
