"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CellValueChangedEvent, ColDef } from "ag-grid-community";
import { toast } from "sonner";
import { DataGrid } from "@/components/shared/console/data-grid";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/client";
import { formatDate } from "@/lib/utils";
import { RecentActions } from "./actions";
import type { Recent } from "./entry";

// Previous chats in a sortable, searchable grid. Click a row to open it.
export function RecentHistory() {
  const router = useRouter();
  const [recents, setRecents] = useState<Recent[] | null>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const editingId = useRef<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: chats, error } = await createClient()
        .from("chats")
        .select("id, title, updated_at")
        .order("updated_at", { ascending: false })
        .limit(500);
      if (error) toast.error("Couldn't load your chats.");
      setRecents(
        (chats ?? []).map((chat) => ({
          id: chat.id as string,
          title: chat.title as string,
          updated_at: chat.updated_at as string,
        }))
      );
    }
    void load();
  }, []);

  async function rename(id: string, title: string, previous: string) {
    const next = title.trim().slice(0, 200);
    if (!next || next === previous) {
      setRecents((current) => current?.map((item) => (item.id === id ? { ...item, title: previous } : item)) ?? null);
      return;
    }
    const { error } = await createClient().from("chats").update({ title: next }).eq("id", id);
    if (error) {
      toast.error("Couldn't rename that chat.");
      setRecents((current) => current?.map((item) => (item.id === id ? { ...item, title: previous } : item)) ?? null);
      return;
    }
    setRecents((current) => current?.map((item) => (item.id === id ? { ...item, title: next } : item)) ?? null);
  }

  async function remove(id: string) {
    setBusy(true);
    const { error } = await createClient().from("chats").delete().eq("id", id);
    setBusy(false);
    if (error) {
      toast.error("Couldn't delete that chat.");
      return;
    }
    setRecents((current) => current?.filter((item) => item.id !== id) ?? null);
    toast.success("Chat deleted.");
  }

  const columns = useMemo<ColDef<Recent>[]>(
    () => [
      {
        field: "title",
        headerName: "Chat",
        flex: 1,
        minWidth: 200,
        // Only the row whose rename button was pressed can be edited, so a
        // click on any title still opens the chat.
        editable: (p) => p.data?.id === editingId.current,
        cellEditorParams: { maxLength: 200 },
      },
      {
        field: "updated_at",
        headerName: "Last message",
        sort: "desc",
        width: 190,
        valueFormatter: (p) => formatDate(p.value, true),
      },
      {
        headerName: "",
        colId: "actions",
        width: 110,
        sortable: false,
        filter: false,
        resizable: false,
        cellRenderer: (p: { data?: Recent; api: { startEditingCell: (cell: { rowIndex: number; colKey: string }) => void }; node: { rowIndex: number | null } }) =>
          p.data ? (
            <RecentActions
              disabled={busy}
              onRename={() => {
                if (p.node.rowIndex === null) return;
                editingId.current = p.data!.id;
                p.api.startEditingCell({ rowIndex: p.node.rowIndex, colKey: "title" });
              }}
              onDelete={() => {
                if (window.confirm(`Delete "${p.data!.title}"? This can't be undone.`)) void remove(p.data!.id);
              }}
            />
          ) : null,
      },
    ],
    [busy]
  );

  if (recents === null) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }

  if (recents.length === 0) {
    return (
      <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
        No chats yet.{" "}
        <Link href="/console/chat" className="text-foreground underline underline-offset-4">
          Start one
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <Input
        type="search"
        aria-label="Search chats"
        placeholder="Search chats"
        className="max-w-xs"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <DataGrid<Recent>
        rows={recents}
        columns={columns}
        getRowId={(row) => row.id}
        quickFilter={search}
        heightClass="h-[calc(100svh-14rem)] min-h-80"
        pageSize={50}
        onRowClick={(row) => router.push(`/console/chat/${row.id}`)}
        onCellValueChanged={(event: CellValueChangedEvent<Recent>) => {
          editingId.current = null;
          if (event.colDef.field === "title" && event.data) {
            void rename(event.data.id, String(event.newValue ?? ""), String(event.oldValue ?? ""));
          }
        }}
      />
    </div>
  );
}
