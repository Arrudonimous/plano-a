import { useTranslations } from "next-intl";
import { CapsuleForm } from "@/components/dreams/capsule/CapsuleForm";
import { CapsuleCard } from "@/components/dreams/capsule/CapsuleCard";
import type { Database } from "@/lib/types/database.types";

type Capsule = Database["public"]["Tables"]["time_capsules"]["Row"];

export function TimeCapsule({
  capsules,
  minDate,
  maxDate,
}: {
  capsules: Capsule[];
  minDate: string;
  maxDate: string;
}) {
  const t = useTranslations("capsula");

  return (
    <div className="space-y-6">
      <CapsuleForm minDate={minDate} maxDate={maxDate} />
      {capsules.length > 0 ? (
        <div className="space-y-3">
          {capsules.map((capsule) => (
            <CapsuleCard key={capsule.id} capsule={capsule} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      )}
    </div>
  );
}
