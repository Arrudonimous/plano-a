import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/lib/actions/auth";
import { Logo } from "@/components/brand/Logo";
import { BottomNav } from "@/components/nav/BottomNav";
import { InstallBanner } from "@/components/pwa/InstallBanner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const locale = await getLocale();
    redirect({ href: "/login", locale });
  }

  const t = await getTranslations("auth");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <Logo size={24} className="text-sm" />
        <form action={signOutAction}>
          <button
            type="submit"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {t("logout")}
          </button>
        </form>
      </header>
      <InstallBanner />
      <main className="flex-1 pb-4">{children}</main>
      <BottomNav />
    </div>
  );
}
