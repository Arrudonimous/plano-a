import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("erro");

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-semibold">{t("notFoundTitle")}</h1>
      <p className="text-sm text-muted-foreground">{t("notFoundBody")}</p>
      <Link
        href="/hoje"
        className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        {t("home")}
      </Link>
    </main>
  );
}
