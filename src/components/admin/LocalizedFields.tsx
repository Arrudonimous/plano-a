import { CONTENT_LOCALES } from "@/lib/content/form";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

/** Um campo por idioma: name="<campo>.<idioma>". */
export function LocalizedFields({
  field,
  label,
  values,
  multiline = false,
  rows = 4,
  maxLength,
}: {
  field: string;
  label: string;
  values?: Record<string, string> | null;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-medium text-muted-foreground">{label}</legend>
      {CONTENT_LOCALES.map((locale) => {
        const common = {
          name: `${field}.${locale}`,
          defaultValue: values?.[locale] ?? "",
          placeholder: locale,
          "aria-label": `${label} (${locale})`,
          maxLength,
        };
        return multiline ? (
          <Textarea key={locale} rows={rows} {...common} />
        ) : (
          <Input key={locale} {...common} />
        );
      })}
    </fieldset>
  );
}
