# Plano A: Roadmap

## Estado

Todas as funcionalidades planejadas estão implementadas e testadas (unitários, banco/RLS e E2E contra um Supabase local). O que falta é **ligar os serviços reais e validar com pessoas**: veja [docs/LAUNCH.md](./docs/LAUNCH.md).

## Concluído

### v1: núcleo
- [x] Auth, Meu Dia, Lista dos Sonhos, Meus Objetivos (6 meses / 1 / 5 / 10 anos), Minha Ação (hoje + hábitos), Configurações
- [x] PWA (Serwist), i18n, identidade visual, ícones, seletor de idioma

### Minha Visão
- [x] Mural dos Sonhos (upload direto ao Storage, comentários, exportar como imagem)
- [x] Cápsula do Tempo (e-mail via Resend, selada no banco, retenção estendida de até 5 anos no Premium)
- [x] Gratidão

### Minha Ação
- [x] Projetos com passos, "Enviar para hoje"
- [x] Plano Financeiro: orçamento, lançamentos por mês e categoria, dívidas com juros, reserva, metas ligadas a sonhos, várias moedas com cotação diária
- [x] Jornada CLT → Negócio (jornada guiada que vira projeto com os passos práticos)

### Minha Evolução
- [x] Afirmações diárias (Claude)
- [x] Programas, Jornadas e Mentalizações (motor de conteúdo guiado com player YouTube/Vimeo/arquivo/Storage, progresso e acesso Premium por RLS)
- [x] Meu Espaço (espiritualidade sem rótulo: reflexões, práticas, intenções, inspirações, pergunta do dia)
- [x] Progresso e 21 conquistas derivadas do histórico; cartões de compartilhamento (imagem PNG)

### Plataforma
- [x] Assinatura Premium (Stripe: checkout, portal, webhook com assinatura verificada)
- [x] Painel /admin: CRUD de conteúdo, upload de mídia, métricas agregadas
- [x] Analytics pseudonimizado, só com consentimento
- [x] Espanhol completo (para revisão humana) e idioma preferido sincronizado com e-mails/afirmações
- [x] Segurança: RLS testada, rate limiting, CSP e cabeçalhos, marca d'água em conteúdo premium, Storage por pasta, cronos protegidos
- [x] Conta: exportar dados (JSON) e excluir conta (cancela assinatura, apaga arquivos)
- [x] Páginas públicas de Privacidade e Termos (rascunho a revisar)
- [x] Acessibilidade (axe: WCAG 2.1 AA nas telas principais), páginas de erro, registro de erros do servidor
- [x] CI (tipos, lint, testes, traduções, build, migrations/RLS) e E2E

## Depende do dono (não dá para fazer no código)

Ver [docs/LAUNCH.md](./docs/LAUNCH.md): aplicar migrations e configurar Supabase/Vercel/Resend/Anthropic/Stripe, testar com serviços e dispositivos reais, revisar conteúdo e textos jurídicos, definir preços, gravar mídias, revisão humana de en/es.

## Ideias para depois do lançamento

- Notificações push (lembrete gentil do dia, cápsula entregue)
- Importação de extrato/Open Finance no Plano Financeiro
- Novas jornadas e programas (o painel já suporta; é conteúdo)
- Compartilhamento do progresso entre parceiros/família (hoje tudo é individual)
- Migrar a CSP para nonce e adicionar legendas aos vídeos
- Subir as 6 vulnerabilidades de dev (eslint/brace-expansion) quando houver versão compatível

## Notas

- O grafo do `graphify` deste projeto deve ser gerado/atualizado com `plano-a/` como working root, nunca a partir da raiz `Freelancer/`.
- Preocupação de posicionamento: o app não pode parecer só um planejador; deve guiar a pessoa a se desenvolver. A home destaca "Sua jornada" e o conteúdo guiado está no centro do menu "Mais", mas isso é questão de produto e conteúdo, não só de funcionalidades.
