function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const COPY = {
  "pt-BR": {
    subject: "Uma mensagem do seu passado chegou",
    intro: (written: string) =>
      `Em ${written}, você escreveu esta mensagem para o seu eu do futuro:`,
    outro: "Olhe para onde você chegou. Quanto desse caminho você já percorreu?",
    cta: "Abrir o Plano A",
    locale: "pt-BR",
  },
  en: {
    subject: "A message from your past has arrived",
    intro: (written: string) =>
      `On ${written}, you wrote this message to your future self:`,
    outro: "Look at how far you've come. How much of this path have you already walked?",
    cta: "Open Plano A",
    locale: "en",
  },
  es: {
    subject: "Llegó un mensaje de tu pasado",
    intro: (written: string) =>
      `El ${written}, escribiste este mensaje para tu yo del futuro:`,
    outro: "Mira hasta dónde has llegado. ¿Cuánto de este camino ya recorriste?",
    cta: "Abrir Plano A",
    locale: "es",
  },
} as const;

export function buildCapsuleEmail({
  language,
  message,
  createdAt,
  siteUrl,
}: {
  language: string | null;
  message: string;
  createdAt: string;
  siteUrl: string;
}) {
  const lang = language?.toLowerCase() ?? "";
  const copy = lang.startsWith("en") ? COPY.en : lang.startsWith("es") ? COPY.es : COPY["pt-BR"];
  const written = new Intl.DateTimeFormat(copy.locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(createdAt));
  const prefix = copy.locale === "pt-BR" ? "" : `/${copy.locale}`;
  const link = `${siteUrl}${prefix}/sonhos`;

  const text = `${copy.intro(written)}\n\n${message}\n\n${copy.outro}\n${link}`;
  const html = `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1b1f2a">
<p style="color:#6b7280">${escapeHtml(copy.intro(written))}</p>
<blockquote style="margin:16px 0;padding:16px 20px;background:#faf7f2;border-left:4px solid #a8631f;border-radius:8px;white-space:pre-wrap;font-size:16px;line-height:1.6">${escapeHtml(message)}</blockquote>
<p>${escapeHtml(copy.outro)}</p>
<p><a href="${escapeHtml(link)}" style="color:#1e2a4a;font-weight:600">${escapeHtml(copy.cta)}</a></p>
</div>`;

  return { subject: copy.subject, html, text };
}
