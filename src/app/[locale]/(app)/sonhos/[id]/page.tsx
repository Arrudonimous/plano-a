import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { updateDream } from "@/lib/actions/dreams";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default async function EditDreamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const t = await getTranslations("sonhos");
  const tCommon = await getTranslations("common");

  const { data: dream } = await supabase
    .from("dreams")
    .select("*")
    .eq("id", id)
    .single();

  if (!dream) notFound();

  const action = updateDream.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <form action={action} className="space-y-3">
        <Textarea
          name="description"
          defaultValue={dream.description}
          rows={3}
          required
        />
        <label className="block text-sm text-muted-foreground">
          {t("targetDate")}
          <Input
            type="date"
            name="targetDate"
            defaultValue={dream.target_date ?? ""}
            className="mt-1"
          />
        </label>
        <Button type="submit">{tCommon("save")}</Button>
      </form>
    </div>
  );
}
