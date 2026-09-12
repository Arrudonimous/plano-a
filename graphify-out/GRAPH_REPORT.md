# Graph Report - plano-a  (2026-09-12)

## Corpus Check
- Corpus is ~8,136 words - fits in a single context window. You may not need a graph.

## Summary
- 265 nodes · 485 edges · 32 communities (12 shown, 19 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.82)
- Token cost: 125,875 input · 0 output

## Community Hubs (Navigation)
- PWA Install & Setup Notes
- App Route Pages
- Next.js & Package Config
- Auth Pages (Login/Signup)
- Minha Acao: Habitos UI
- Root Layout, i18n & Proxy Auth
- Objetivos Feature + Supabase Clients
- TypeScript Config
- Package Dependencies
- Package DevDependencies
- Minha Acao: Hoje UI
- PWA Install Prompt Logic
- Agent/Claude Instruction Docs
- ESLint Config
- PostCSS Config
- README & Roadmap Docs
- Roadmap: Academia & Admin CMS
- Roadmap: Analytics & Content Hardening
- PWA App Icon
- Tailwind CSS Mention
- Roadmap: Afirmacoes/Mentalizacoes/Programas
- Roadmap: Capsula do Tempo
- Roadmap: CLT to Negocio
- Roadmap: Espiritualidade
- Roadmap: i18n Expansion
- Roadmap: Graphify Scoping Note
- Roadmap: Gratidao
- Roadmap: Issue Workflow Note
- Roadmap: Pagamentos & Assinaturas
- Roadmap: Planejamento & Projetos
- Roadmap: Plano Financeiro

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 41 edges
2. `next-intl` - 16 edges
3. `compilerOptions` - 16 edges
4. `Button` - 13 edges
5. `todayInTimeZone()` - 12 edges
6. `react` - 10 edges
7. `Status: Núcleo Essencial (v1)` - 10 edges
8. `Input` - 8 edges
9. `checkInHabit()` - 7 edges
10. `undoHabitCheckIn()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Next.js Breaking-Changes Warning` --conceptually_related_to--> `Next.js 16 (App Router, proxy.ts)`  [INFERRED]
  AGENTS.md → README.md
- `Pending: final visual identity` --conceptually_related_to--> `Plano A (personal development / life-planning PWA)`  [INFERRED]
  ROADMAP.md → README.md
- `Autenticação (cadastro/login/logout) via Supabase Auth` --references--> `Supabase (Postgres, Auth, RLS)`  [EXTRACTED]
  ROADMAP.md → README.md
- `Vision Board (moodboard, Supabase Storage upload, export/share)` --references--> `Supabase (Postgres, Auth, RLS)`  [EXTRACTED]
  ROADMAP.md → README.md
- `Scaffold: Next.js + PWA (Serwist) + i18n (next-intl) + Supabase` --references--> `next-intl (i18n, pt-BR active, en skeleton)`  [EXTRACTED]
  ROADMAP.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Plano A Core Tech Stack** — readme_nextjs, readme_supabase, readme_next_intl, readme_serwist, readme_tailwindcss [EXTRACTED 1.00]
- **Núcleo Essencial v1 Feature Modules** — roadmap_autenticacao, roadmap_meu_dia, roadmap_lista_dos_sonhos, roadmap_meus_objetivos, roadmap_minha_acao [EXTRACTED 1.00]
- **Plano A Top-Level Documentation Set** — agents_doc, claude_doc, readme_doc, roadmap_doc [INFERRED 0.85]

## Communities (32 total, 19 thin omitted)

### Community 0 - "PWA Install & Setup Notes"
Cohesion: 0.07
Nodes (34): generate-agent-files.js, next dev (regenerates AGENTS.md block), Next.js Breaking-Changes Warning, Android/Chrome beforeinstallprompt, .env.local configuration, iOS/Safari manual install hint, Lighthouse PWA audit, next-intl (i18n, pt-BR active, en skeleton) (+26 more)

### Community 1 - "App Route Pages"
Cohesion: 0.11
Nodes (22): GET(), ConfiguracoesPage(), GREETING_KEY, HojePage(), AppLayout(), EditDreamPage(), SonhosPage(), Dream (+14 more)

### Community 2 - "Next.js & Package Config"
Cohesion: 0.07
Nodes (25): nextConfig, withNextIntl, withSerwist, name, private, scripts, build, dev (+17 more)

### Community 3 - "Auth Pages (Login/Signup)"
Cohesion: 0.21
Nodes (14): next-intl, react, initialState, LoginPage(), initialState, SignupPage(), Button, Variant (+6 more)

### Community 4 - "Minha Acao: Habitos UI"
Cohesion: 0.19
Nodes (16): HabitDetailPage(), AcaoPage(), AcaoTabs(), QuickAddAction(), Habit, HabitList(), NewHabitForm(), StreakBadge() (+8 more)

### Community 5 - "Root Layout, i18n & Proxy Auth"
Cohesion: 0.13
Nodes (13): geistSans, metadata, viewport, { Link, redirect, usePathname, useRouter, getPathname }, AppLocale, routing, getUserForRequest(), AUTH_PATHS (+5 more)

### Community 6 - "Objetivos Feature + Supabase Clients"
Cohesion: 0.19
Nodes (10): server-only, @supabase/ssr, @supabase/supabase-js, ObjetivosPage(), PERIODS, ObjectivePeriodEditor(), PERIOD_LABEL_KEY, upsertObjective() (+2 more)

### Community 7 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 8 - "Package Dependencies"
Cohesion: 0.20
Nodes (10): dependencies, next, next-intl, react, react-dom, server-only, serwist, @serwist/next (+2 more)

### Community 9 - "Package DevDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+1 more)

### Community 10 - "Minha Acao: Hoje UI"
Cohesion: 0.43
Nodes (6): DailyAction, TodayActionList(), createDailyAction(), currentUserTimezone(), deleteDailyAction(), toggleDailyActionDone()

### Community 11 - "PWA Install Prompt Logic"
Cohesion: 0.32
Nodes (5): InstallBanner(), BeforeInstallPromptEvent, isIosDevice(), isStandaloneDisplay(), useInstallPrompt()

## Knowledge Gaps
- **101 isolated node(s):** `eslintConfig`, `withNextIntl`, `withSerwist`, `nextConfig`, `name` (+96 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 116 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next-intl` connect `Auth Pages (Login/Signup)` to `App Route Pages`, `Next.js & Package Config`, `Minha Acao: Habitos UI`, `Root Layout, i18n & Proxy Auth`, `Objetivos Feature + Supabase Clients`, `Minha Acao: Hoje UI`?**
  _High betweenness centrality (0.163) - this node is a cross-community bridge._
- **Why does `Supabase (Postgres, Auth, RLS)` connect `PWA Install & Setup Notes` to `Objetivos Feature + Supabase Clients`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `createClient()` connect `App Route Pages` to `Minha Acao: Hoje UI`, `Auth Pages (Login/Signup)`, `Minha Acao: Habitos UI`, `Objetivos Feature + Supabase Clients`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `withNextIntl`, `withSerwist` to the rest of the system?**
  _101 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PWA Install & Setup Notes` be split into smaller, more focused modules?**
  _Cohesion score 0.0748663101604278 - nodes in this community are weakly interconnected._
- **Should `App Route Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.11491935483870967 - nodes in this community are weakly interconnected._
- **Should `Next.js & Package Config` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._