import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { DreamForm } from "@/components/dreams/DreamForm";
import { DreamCard } from "@/components/dreams/DreamCard";

export default async function SonhosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getTranslations("sonhos");

  const { data: dreams } = await supabase
    .from("dreams")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <DreamForm />
      {dreams && dreams.length > 0 ? (
        <div className="space-y-3">
          {dreams.map((dream) => (
            <DreamCard key={dream.id} dream={dream} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      )}
    </div>
  );
}
