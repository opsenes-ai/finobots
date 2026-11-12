"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient, getWorkspaceId } from "@/lib/client";

const MAX = 4000;

// Custom instructions the agent follows in every chat.
export function PersonalisationInstructions() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [saved, setSaved] = useState("");
  const [text, setText] = useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const orgId = await getWorkspaceId();
      setOrganizationId(orgId);
      if (orgId) {
        const { data } = await createClient()
          .from("agent_settings")
          .select("instructions")
          .eq("organization_id", orgId)
          .maybeSingle();
        const value = data?.instructions ?? "";
        setSaved(value);
        setText(value);
      }
      setReady(true);
    }
    void load();
  }, []);

  async function save() {
    if (!organizationId) return;
    setSaving(true);
    const value = text.trim();
    const { error } = await createClient()
      .from("agent_settings")
      .upsert({ organization_id: organizationId, instructions: value || null });
    setSaving(false);
    if (error) {
      toast.error("Couldn't save. Only owners and admins can change this.");
      return;
    }
    setSaved(value);
    setText(value);
    toast.success("Instructions saved.");
  }

  const changed = text.trim() !== saved;

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Instructions</h3>
      <div className="space-y-1.5">
        <Label htmlFor="agent-instructions" className="sr-only">
          Custom instructions
        </Label>
        <Textarea
          id="agent-instructions"
          rows={5}
          maxLength={MAX}
          disabled={!ready || !organizationId}
          placeholder="For example: always show amounts in GBP, and flag invoices over 30 days overdue."
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">
          {text.length}/{MAX}
        </span>
        <Button size="sm" disabled={!changed || saving || !organizationId} onClick={save}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </section>
  );
}
