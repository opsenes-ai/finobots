"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient, getWorkspaceId } from "@/lib/client";

// Display name.
export function ProfilePersonal() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [saved, setSaved] = useState("");
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      setUserId(auth.user.id);
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", auth.user.id)
        .maybeSingle();
      const value = data?.full_name ?? "";
      setSaved(value);
      setFullName(value);
    }
    void load();
  }, []);

  const changed = fullName.trim() !== saved;

  async function save() {
    if (!userId) return;
    setSaving(true);
    const supabase = createClient();
    const name = fullName.trim();

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name || null })
      .eq("id", userId);

    if (error) {
      setSaving(false);
      toast.error("Couldn't save your changes. Try again.");
      return;
    }

    // Keep the sign-in metadata in step with the profile.
    await supabase.auth.updateUser({ data: { full_name: name } });
    setSaving(false);
    setSaved(name);
    setFullName(name);
    toast.success("Display name updated.");
    router.refresh();
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Display name</h3>
      <form
        className="flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="full-name" className="sr-only">
            Display name
          </Label>
          <Input
            id="full-name"
            maxLength={100}
            autoComplete="name"
            disabled={!userId}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        </div>
        <Button type="submit" size="sm" disabled={!changed || saving || !userId}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </form>
    </section>
  );
}

// A read-only value with a button that copies it.
export function CopyField({ id, label, value }: { id: string; label: string; value: string | null }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy. Select the text and copy it instead.");
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border p-2 pl-3">
      <span id={id} className="text-muted-foreground w-28 shrink-0 text-sm">
        {label}
      </span>
      <span
        aria-labelledby={id}
        className="min-w-0 flex-1 truncate font-mono text-xs select-all"
        title={value ?? undefined}
      >
        {value ?? "…"}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Copy ${label}`}
        disabled={!value}
        onClick={copy}
      >
        {copied ? <Check /> : <Copy />}
      </Button>
    </div>
  );
}

// The ids support and the API ask for.
export function ProfileIds() {
  const [userId, setUserId] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await createClient().auth.getUser();
      setUserId(data.user?.id ?? null);
      setOrganizationId(await getWorkspaceId());
    }
    void load();
  }, []);

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Identifiers</h3>
      <div className="grid gap-2">
        <CopyField id="user-id" label="User ID" value={userId} />
        <CopyField id="organization-id" label="Organization ID" value={organizationId} />
      </div>
    </section>
  );
}
