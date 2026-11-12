"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient, getWorkspaceId } from "@/lib/client";

type Memory = { id: string; content: string; created_at: string };

const MAX_MEMORIES = 50;

// Short facts the agent remembers about the business.
export function PersonalisationMemory() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [memories, setMemories] = useState<Memory[] | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const orgId = await getWorkspaceId();
    setOrganizationId(orgId);
    if (!orgId) {
      setMemories([]);
      return;
    }
    const { data, error } = await createClient()
      .from("agent_memories")
      .select("id, content, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (error) toast.error("Couldn't load memories.");
    setMemories((data as Memory[] | null) ?? []);
  }, []);

  useEffect(() => {
    // Loads once on mount; state is set after the requests finish.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function add() {
    const content = draft.trim();
    if (!organizationId || !content) return;
    setBusy(true);
    const { error } = await createClient()
      .from("agent_memories")
      .insert({ organization_id: organizationId, content });
    setBusy(false);
    if (error) {
      toast.error("Couldn't save. Only owners and admins can add memories.");
      return;
    }
    setDraft("");
    await load();
  }

  async function remove(id: string) {
    setBusy(true);
    const { error } = await createClient().from("agent_memories").delete().eq("id", id);
    setBusy(false);
    if (error) {
      toast.error("Couldn't remove that memory.");
      return;
    }
    setMemories((current) => current?.filter((memory) => memory.id !== id) ?? null);
  }

  const full = (memories?.length ?? 0) >= MAX_MEMORIES;

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-medium">Memory</h3>
        <p className="text-muted-foreground text-sm">
          Things the agent should always know, like your payment terms or preferred currency.
        </p>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void add();
        }}
      >
        <Label htmlFor="new-memory" className="sr-only">
          New memory
        </Label>
        <Input
          id="new-memory"
          maxLength={500}
          placeholder="For example: we invoice on net 30 terms"
          disabled={!organizationId || full}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button type="submit" disabled={busy || !draft.trim() || !organizationId || full}>
          Add
        </Button>
      </form>

      {memories === null ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : memories.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm">
          Nothing saved yet.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {memories.map((memory) => (
            <li key={memory.id} className="flex items-center justify-between gap-4 p-3">
              <span className="text-sm">{memory.content}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Remove memory"
                disabled={busy}
                onClick={() => remove(memory.id)}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {full ? (
        <p className="text-muted-foreground text-xs">
          You&apos;ve reached {MAX_MEMORIES} memories. Remove one to add another.
        </p>
      ) : null}
    </section>
  );
}
