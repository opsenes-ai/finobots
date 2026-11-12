import { Skeleton } from "@/components/ui/skeleton";

const fields = ["Tone", "Length", "Language"];

// Tone, length, and language.
export function PersonalisationResponses() {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Responses</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        {fields.map((label) => (
          <div key={label} className="space-y-2">
            <p className="text-xs text-muted-foreground">{label}</p>
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
    </section>
  );
}
