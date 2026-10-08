/** Módulos acessados pelo hub "Mais" (e agrupados no destaque da BottomNav). */
export const MORE_MODULES = [
  { href: "/jornadas", key: "jornadas" },
  { href: "/programas", key: "programas" },
  { href: "/mentalizacoes", key: "mentalizacoes" },
  { href: "/espaco", key: "espaco" },
  { href: "/afirmacoes", key: "afirmacoes" },
  { href: "/gratidao", key: "gratidao" },
  { href: "/progresso", key: "progresso" },
  { href: "/financeiro", key: "financeiro" },
  { href: "/planos", key: "planos" },
  { href: "/configuracoes", key: "configuracoes" },
] as const;

export const MORE_HREFS: string[] = ["/mais", "/conteudo", "/admin", ...MORE_MODULES.map((m) => m.href)];
