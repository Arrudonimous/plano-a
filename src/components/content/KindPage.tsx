import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { loadProgramCards, type ProgramKind } from "@/lib/content/load";
import { ProgramList } from "@/components/content/ProgramList";

const KEYS = {
  program: "programs",
  journey: "journeys",
  meditation: "meditations",
} as const;

/** Página de listagem de um tipo de conteúdo guiado. */
export async function KindPage({ kind }: { kind: ProgramKind }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getTranslations("conteudo");
  const key = KEYS[kind];

  const cards = await loadProgramCards(supabase, user!.id, kind);

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <div>
        <h1 className="text-xl font-semibold">{t(`${key}.title`)}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t(`${key}.subtitle`)}</p>
      </div>
      <ProgramList cards={cards} />
    </div>
  );
}
