/** Módulos acessados pelo hub "Mais" (e agrupados no destaque da BottomNav). */
export const MORE_MODULES = [
  { href: "/afirmacoes", key: "afirmacoes" },
  { href: "/gratidao", key: "gratidao" },
  { href: "/progresso", key: "progresso" },
  { href: "/financeiro", key: "financeiro" },
  { href: "/configuracoes", key: "configuracoes" },
] as const;

export const MORE_HREFS: string[] = ["/mais", ...MORE_MODULES.map((m) => m.href)];
