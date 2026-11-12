"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createClient, getWorkspaceId } from "@/lib/client";
import { cn } from "@/lib/utils";

// "forever" is stored as null.
const OPTIONS = [
  { value: "forever", label: "Keep forever", days: null },
  { value: "365", label: "1 year", days: 365 },
  { value: "180", label: "6 months", days: 180 },
  { value: "90", label: "90 days", days: 90 },
];

// How long data is kept. Keep forever by default.
export function DataRetention() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [value, setValue] = useState("forever");

  useEffect(() => {
    async function load() {
      const orgId = await getWorkspaceId();
      setOrganizationId(orgId);
      if (!orgId) return;
      const { data } = await createClient()
        .from("organizations")
        .select("retention_days")
        .eq("id", orgId)
        .maybeSingle();
      const days = data?.retention_days as number | null | undefined;
      const match = OPTIONS.find((option) => option.days === (days ?? null));
      if (match) setValue(match.value);
    }
    void load();
  }, []);

  async function change(next: string) {
    if (!organizationId) return;
    const previous = value;
    setValue(next);
    const days = OPTIONS.find((option) => option.value === next)?.days ?? null;
    const { error } = await createClient()
      .from("organizations")
      .update({ retention_days: days })
      .eq("id", organizationId);
    if (error) {
      setValue(previous);
      toast.error("Couldn't save. Only owners and admins can change this.");
    }
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Retention</h3>
      <RadioGroup
        value={value}
        disabled={!organizationId}
        onValueChange={(next) => void change(next)}
        aria-label="Retention period"
        className="sm:grid-cols-2"
      >
        {OPTIONS.map((option) => (
          <Label
            key={option.value}
            htmlFor={`retention-${option.value}`}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-lg border p-3 font-normal",
              value === option.value && "border-primary"
            )}
          >
            <RadioGroupItem id={`retention-${option.value}`} value={option.value} />
            {option.label}
          </Label>
        ))}
      </RadioGroup>
    </section>
  );
}
