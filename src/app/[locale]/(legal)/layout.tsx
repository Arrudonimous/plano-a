import { Logo } from "@/components/brand/Logo";
import { Link } from "@/i18n/navigation";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <Logo size={24} className="text-sm" />
        <Link href="/hoje" className="text-xs text-muted-foreground hover:text-foreground">
          ← Plano A
        </Link>
      </header>
      {children}
    </div>
  );
}
