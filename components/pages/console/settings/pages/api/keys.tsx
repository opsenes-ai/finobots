"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient, functionErrorMessage, getWorkspaceId } from "@/lib/client";
import type { ColDef } from "ag-grid-community";
import { DataGrid } from "@/components/ui/data-grid";
import { formatDate } from "@/lib/utils";
import { API_SCOPES } from "./scopes";

type ApiKey = {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  last_used_at: string | null;
  created_at: string;
};

// API keys: create one, copy it once, revoke it later.
export function ApiKeys() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [keys, setKeys] = useState<ApiKey[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>(["accounts:read", "transactions:read"]);
  const [busy, setBusy] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const orgId = await getWorkspaceId();
    setOrganizationId(orgId);
    if (!orgId) {
      setKeys([]);
      return;
    }
    const { data, error } = await createClient()
      .from("api_keys")
      .select("id, name, prefix, scopes, last_used_at, created_at")
      .eq("organization_id", orgId)
      .is("revoked_at", null)
      .order("created_at", { ascending: false });
    if (error) toast.error("Couldn't load your keys.");
    setKeys((data as ApiKey[] | null) ?? []);
  }, []);

  useEffect(() => {
    // Loads once on mount; state is set after the request finishes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function create() {
    if (!organizationId || !name.trim() || scopes.length === 0) return;
    setBusy(true);
    const { data, error } = await createClient().functions.invoke("api-keys", {
      body: { organization_id: organizationId, name: name.trim(), scopes },
    });
    setBusy(false);
    if (error) {
      toast.error(await functionErrorMessage(error));
      return;
    }
    // Functions reply with { data: ... }.
    setNewKey((data as { data: { key: string } }).data.key);
    setCreating(false);
    setName("");
    await load();
  }

  async function revoke(id: string) {
    setBusy(true);
    const { error } = await createClient()
      .from("api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id);
    setBusy(false);
    if (error) {
      toast.error("Couldn't revoke that key.");
      return;
    }
    setKeys((current) => current?.filter((key) => key.id !== id) ?? null);
    toast.success("Key revoked.");
  }

  const columns: ColDef<ApiKey>[] = [
    { field: "name", headerName: "Name", flex: 1, minWidth: 150 },
    { field: "prefix", headerName: "Key", width: 110, valueFormatter: (p) => `${p.value}…`, cellClass: "font-mono" },
    { field: "scopes", headerName: "Scopes", flex: 1, minWidth: 160, valueFormatter: (p) => (p.value ?? []).join(", ") },
    { field: "created_at", headerName: "Created", width: 130, valueFormatter: (p) => formatDate(p.value) },
    {
      field: "last_used_at",
      headerName: "Last used",
      width: 130,
      sort: "desc",
      valueFormatter: (p) => (p.value ? formatDate(p.value) : "Never"),
    },
    {
      headerName: "",
      colId: "actions",
      width: 110,
      sortable: false,
      filter: false,
      resizable: false,
      cellRenderer: (p: { data?: ApiKey }) =>
        p.data ? (
          <Button variant="destructive" size="xs" disabled={busy} onClick={() => revoke(p.data!.id)}>
            Revoke
          </Button>
        ) : null,
    },
  ];

  async function copy() {
    if (!newKey) return;
    try {
      await navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy. Select the key and copy it instead.");
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Keys</h3>
        {!creating ? (
          <Button size="sm" disabled={!organizationId} onClick={() => setCreating(true)}>
            Create key
          </Button>
        ) : null}
      </div>

      {newKey ? (
        <div className="space-y-2 rounded-lg border border-primary p-3">
          <p className="text-sm font-medium">Copy your key now. It won&apos;t be shown again.</p>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate text-xs select-all">{newKey}</code>
            <Button variant="outline" size="icon-sm" aria-label="Copy key" onClick={copy}>
              {copied ? <Check /> : <Copy />}
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setNewKey(null)}>
            Done
          </Button>
        </div>
      ) : null}

      {creating ? (
        <form
          className="space-y-4 rounded-lg border p-3"
          onSubmit={(event) => {
            event.preventDefault();
            void create();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="key-name">Name</Label>
            <Input
              id="key-name"
              maxLength={100}
              placeholder="For example: Reporting script"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Scopes</legend>
            {API_SCOPES.map((scope) => (
              <div key={scope.value} className="flex items-center gap-2">
                <Checkbox
                  id={`scope-${scope.value}`}
                  checked={scopes.includes(scope.value)}
                  onCheckedChange={(checked) =>
                    setScopes((current) =>
                      checked ? [...current, scope.value] : current.filter((s) => s !== scope.value)
                    )
                  }
                />
                <Label htmlFor={`scope-${scope.value}`} className="font-normal">
                  {scope.label}
                </Label>
              </div>
            ))}
          </fieldset>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={busy || !name.trim() || scopes.length === 0}>
              {busy ? "Creating…" : "Create"}
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {keys === null ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : keys.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm">
          No keys yet.
        </p>
      ) : (
        <DataGrid<ApiKey>
          rows={keys}
          columns={columns}
          getRowId={(row) => row.id}
          heightClass="h-64"
          pageSize={10}
        />
      )}
    </section>
  );
}
