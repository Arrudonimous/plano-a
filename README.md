# Plano A

Sonhe. Planeje. Aja. Avance.

Plataforma de desenvolvimento pessoal e planejamento de vida, instalável como PWA no Android e no iPhone. Este repositório contém o **núcleo essencial (MVP)**; o restante da visão do produto está documentado em [ROADMAP.md](./ROADMAP.md).

## Stack

- [Next.js](https://nextjs.org) (App Router) — Next 16, usa `proxy.ts` (não `middleware.ts`, renomeado na v16)
- [Supabase](https://supabase.com) (Postgres, Auth, RLS)
- [next-intl](https://next-intl.dev) (i18n, pt-BR ativo, en como skeleton)
- [Serwist](https://serwist.pages.dev) (service worker / PWA) — requires webpack; Next 16 defaults to Turbopack, so `dev`/`build` scripts pin `--webpack` until Serwist adds Turbopack support
- Tailwind CSS v4

## Configuração

1. Crie um projeto no [Supabase](https://supabase.com) e aplique as migrations em `supabase/migrations/` (via SQL editor ou `supabase db push` com a CLI).
2. Copie `.env.example` para `.env.local` e preencha:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (uso restrito a `src/lib/supabase/admin.ts`, nunca exposto ao client)
   - `NEXT_PUBLIC_SITE_URL` (usado no redirect de confirmação de e-mail)
3. Gere os tipos reais do banco (substitui o arquivo hand-authored):
   ```bash
   supabase gen types typescript --linked > src/lib/types/database.types.ts
   ```

## Rodando localmente

```bash
npm run dev
```

O service worker (Serwist) fica desabilitado em desenvolvimento — para testar o comportamento de PWA/offline, use um build de produção:

```bash
npm run build
npm run start
```

## Instalabilidade como PWA

- **Lighthouse**: `npx lighthouse http://localhost:3000/hoje --view` contra o build de produção.
- **Android (Chrome)**: exige HTTPS real (ex.: preview da Vercel); o botão "Instalar Plano A" aparece quando o navegador dispara `beforeinstallprompt`.
- **iOS (Safari)**: não existe `beforeinstallprompt`; o app mostra uma dica manual ("Compartilhar → Adicionar à Tela de Início").

## Estrutura

- `src/app/[locale]/(auth)` — login/cadastro (não autenticado)
- `src/app/[locale]/(app)` — Meu Dia, Sonhos, Objetivos, Minha Ação, Configurações (autenticado)
- `src/lib/actions/` — Server Actions por domínio
- `src/lib/supabase/` — clientes Supabase (browser, server, admin, proxy)
- `src/proxy.ts` — sessão Supabase + roteamento de locale + proteção de rotas
- `supabase/migrations/` — schema SQL, incluindo as políticas de RLS

## Próximos passos

Veja [ROADMAP.md](./ROADMAP.md) para os módulos adiados (Vision Board, Cápsula do Tempo, Financeiro, Academia, pagamentos, admin, etc.) e o que falta para produção.
