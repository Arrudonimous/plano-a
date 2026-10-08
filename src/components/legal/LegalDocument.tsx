import { getTranslations } from "next-intl/server";
import { parseBody } from "@/lib/content/localized";

/** Contato e razão social vêm do ambiente; sem eles, aparece um aviso claro. */
export function legalParams() {
  return {
    company: process.env.NEXT_PUBLIC_COMPANY_NAME ?? "[razão social / company name]",
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "[e-mail de contato / contact email]",
  };
}

export async function LegalDocument({ doc, sections }: { doc: "privacy" | "terms"; sections: number }) {
  const t = await getTranslations("legal");
  const params = legalParams();

  return (
    <article className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t(`${doc}.title`)}</h1>
        <p className="mt-1 text-xs text-muted-foreground">{t("updated")}</p>
        <p className="mt-3 rounded-xl bg-surface-muted p-3 text-xs text-muted-foreground">{t("draftNotice")}</p>
      </div>
      {Array.from({ length: sections }, (_, i) => `s${i + 1}`).map((key) => (
        <section key={key} className="space-y-2">
          <h2 className="text-base font-semibold">{t(`${doc}.${key}.title`)}</h2>
          {parseBody(t(`${doc}.${key}.body`, params)).map((block, i) =>
            block.type === "p" ? (
              <p key={i} className="text-sm leading-relaxed">
                {block.text}
              </p>
            ) : (
              <ul key={i} className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ),
          )}
        </section>
      ))}
    </article>
  );
}
