"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/client";
import { cn } from "@/lib/utils";

type ProviderName = "anthropic" | "openai" | "gemini";

type SavedProvider = {
  provider: ProviderName;
  model: string | null;
  key_last4: string;
  status: "active" | "error";
  is_active: boolean;
};

const PROVIDERS: { id: ProviderName; label: string; hint: string }[] = [
  { id: "anthropic", label: "Claude", hint: "Anthropic API key" },
  { id: "openai", label: "OpenAI", hint: "OpenAI API key" },
  { id: "gemini", label: "Gemini", hint: "Google AI Studio API key" },
];

// Reads the message the function sent back, if there is one.
async function errorMessage(error: unknown): Promise<string> {
  const context = (error as { context?: Response })?.context;
  if (context && typeof context.json === "function") {
    try {
      const body = await context.json();
      const message = body?.error?.message ?? body?.message;
      if (typeof message === "string") return message;
    } catch {
      // Fall through to the generic message.
    }
  }
  return "Something went wrong. Try again.";
}

// Connect your own AI provider keys and pick which one chat uses.
export function PersonalisationModels() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedProvider[] | null>(null);
  const [editing, setEditing] = useState<ProviderName | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: workspace } = await supabase.rpc("my_workspace");
    const orgId = (workspace as { organization_id: string }[] | null)?.[0]?.organization_id;
    if (!orgId) {
      setSaved([]);
      return;
    }
    setOrganizationId(orgId);

    const { data, error } = await supabase
      .from("ai_providers")
      .select("provider, model, key_last4, status, is_active")
      .eq("organization_id", orgId);
    if (error) toast.error("Couldn't load your providers.");
    setSaved((data as SavedProvider[] | null) ?? []);
  }, []);

  useEffect(() => {
    // Loads once on mount; state is set after the requests finish.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function call(key: string, body: Record<string, unknown>, success: string) {
    if (!organizationId) return false;
    setBusy(key);
    const { error } = await createClient().functions.invoke("ai-providers", {
      body: { ...body, organization_id: organizationId },
    });
    setBusy(null);
    if (error) {
      toast.error(await errorMessage(error));
      return false;
    }
    toast.success(success);
    await load();
    return true;
  }

  function openForm(provider: ProviderName, current?: SavedProvider) {
    setEditing(provider);
    setApiKey("");
    setModel(current?.model ?? "");
  }

  async function connect(provider: ProviderName, label: string) {
    const ok = await call(
      `connect-${provider}`,
      { action: "connect", provider, api_key: apiKey, ...(model.trim() ? { model: model.trim() } : {}) },
      `${label} connected.`,
    );
    if (ok) {
      setEditing(null);
      setApiKey("");
      setModel("");
    }
  }

  if (saved === null) {
    return (
      <section className="space-y-3">
        <h3 className="text-sm font-medium">Models</h3>
        <p className="text-muted-foreground text-sm">Loading…</p>
      </section>
    );
  }

  const anyActive = saved.some((item) => item.is_active);

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-medium">Models</h3>
        <p className="text-muted-foreground text-sm">
          Chat uses the built-in Claude Haiku 5.5 by default. Connect your own key to use your
          own account instead. Keys are encrypted and never shown again.
        </p>
      </div>

      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-lg border p-3",
          !anyActive && "border-primary"
        )}
      >
        <div>
          <p className="text-sm font-medium">Built-in default</p>
          <p className="text-muted-foreground text-xs">Claude Haiku 5.5 · usage limits apply</p>
        </div>
        {anyActive ? (
          <Button
            variant="outline"
            size="sm"
            disabled={busy !== null}
            onClick={() => call("default", { action: "use_default" }, "Using the built-in default.")}
          >
            Use default
          </Button>
        ) : (
          <span className="text-primary text-xs font-medium">In use</span>
        )}
      </div>

      {PROVIDERS.map(({ id, label, hint }) => {
        const current = saved.find((item) => item.provider === id);
        const isEditing = editing === id;

        return (
          <div
            key={id}
            className={cn("space-y-3 rounded-lg border p-3", current?.is_active && "border-primary")}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-muted-foreground text-xs">
                  {current
                    ? `Key ending ${current.key_last4}${current.model ? ` · ${current.model}` : " · default model"}`
                    : "Not connected"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {current?.is_active ? (
                  <span className="text-primary text-xs font-medium">In use</span>
                ) : current ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy !== null}
                    onClick={() =>
                      call(`use-${id}`, { action: "use", provider: id }, `Chat now uses ${label}.`)
                    }
                  >
                    Use
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy !== null}
                  onClick={() => (isEditing ? setEditing(null) : openForm(id, current))}
                >
                  {isEditing ? "Cancel" : current ? "Replace key" : "Connect"}
                </Button>
                {current ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy !== null}
                    onClick={() =>
                      call(`remove-${id}`, { action: "remove", provider: id }, `${label} removed.`)
                    }
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            </div>

            {isEditing ? (
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void connect(id, label);
                }}
              >
                <div className="space-y-1.5">
                  <Label htmlFor={`${id}-key`}>{hint}</Label>
                  <Input
                    id={`${id}-key`}
                    type="password"
                    autoComplete="off"
                    required
                    minLength={8}
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`${id}-model`}>Model (optional)</Label>
                  <Input
                    id={`${id}-model`}
                    placeholder="Leave blank for the default"
                    autoComplete="off"
                    value={model}
                    onChange={(event) => setModel(event.target.value)}
                  />
                </div>
                <Button type="submit" size="sm" disabled={busy !== null}>
                  {busy === `connect-${id}` ? "Checking key…" : "Save key"}
                </Button>
              </form>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}
