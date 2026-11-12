"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createClient, getWorkspaceId } from "@/lib/client";
import { cn } from "@/lib/utils";

type Tone = "professional" | "friendly" | "direct";
type Length = "concise" | "balanced" | "detailed";

const TONES: { value: Tone; label: string; description: string }[] = [
  { value: "professional", label: "Professional", description: "Clear and businesslike. Default." },
  { value: "friendly", label: "Friendly", description: "Warm and conversational." },
  { value: "direct", label: "Direct", description: "Straight to the point, no small talk." },
];

const LENGTHS: { value: Length; label: string; description: string }[] = [
  { value: "concise", label: "Concise", description: "A few sentences at most." },
  { value: "balanced", label: "Balanced", description: "Enough detail to act on. Default." },
  { value: "detailed", label: "Detailed", description: "Full explanations and reasoning." },
];

type OptionGroupProps<T extends string> = {
  name: string;
  label: string;
  value: T;
  options: { value: T; label: string; description: string }[];
  disabled: boolean;
  onChange: (value: T) => void;
};

function OptionGroup<T extends string>({
  name,
  label,
  value,
  options,
  disabled,
  onChange,
}: OptionGroupProps<T>) {
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs">{label}</p>
      <RadioGroup
        value={value}
        disabled={disabled}
        onValueChange={(next) => onChange(next as T)}
        aria-label={label}
      >
        {options.map((option) => {
          const id = `${name}-${option.value}`;
          return (
            <Label
              key={option.value}
              htmlFor={id}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal",
                value === option.value && "border-primary"
              )}
            >
              <RadioGroupItem id={id} value={option.value} className="mt-0.5" />
              <span className="space-y-0.5">
                <span className="block text-sm font-medium">{option.label}</span>
                <span className="text-muted-foreground block text-xs">{option.description}</span>
              </span>
            </Label>
          );
        })}
      </RadioGroup>
    </div>
  );
}

// Tone and length of the agent's replies. Saved as soon as one is picked.
export function PersonalisationResponses() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [tone, setTone] = useState<Tone>("professional");
  const [length, setLength] = useState<Length>("balanced");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function load() {
      const orgId = await getWorkspaceId();
      setOrganizationId(orgId);
      if (orgId) {
        const { data } = await createClient()
          .from("agent_settings")
          .select("response_tone, response_length")
          .eq("organization_id", orgId)
          .maybeSingle();
        // No row yet means the defaults apply.
        if (data) {
          setTone(data.response_tone as Tone);
          setLength(data.response_length as Length);
        }
      }
      setReady(true);
    }
    void load();
  }, []);

  async function save(change: { response_tone?: Tone; response_length?: Length }) {
    if (!organizationId) return;
    const { error } = await createClient()
      .from("agent_settings")
      .upsert({ organization_id: organizationId, ...change });
    if (error) toast.error("Couldn't save. Only owners and admins can change this.");
    else toast.success("Saved.");
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Responses</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <OptionGroup
          name="tone"
          label="Tone"
          value={tone}
          options={TONES}
          disabled={!ready || !organizationId}
          onChange={(next) => {
            setTone(next);
            void save({ response_tone: next });
          }}
        />
        <OptionGroup
          name="length"
          label="Length"
          value={length}
          options={LENGTHS}
          disabled={!ready || !organizationId}
          onChange={(next) => {
            setLength(next);
            void save({ response_length: next });
          }}
        />
      </div>
    </section>
  );
}
