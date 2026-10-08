import type { MetadataRoute } from "next";

// Rotas da área logada (sem indexação). As públicas (login, cadastro, privacidade e
// termos) ficam livres. Lista explícita em vez de "Disallow: /" para que qualquer
// leitor de robots.txt, inclusive os que ignoram a regra "o mais específico vence",
// entenda quais páginas são públicas.
const PRIVATE = [
  "hoje", "sonhos", "objetivos", "acao", "afirmacoes", "gratidao", "progresso", "financeiro",
  "jornadas", "programas", "mentalizacoes", "espaco", "planos", "mais", "configuracoes",
  "conteudo", "admin",
];
const PREFIXES = ["", "/en", "/es"];

export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        disallow: ["/api/", "/auth/", ...PREFIXES.flatMap((prefix) => PRIVATE.map((route) => `${prefix}/${route}`))],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
  };
}
