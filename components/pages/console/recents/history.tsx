"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/client";
import { RecentEntry, type Recent } from "./entry";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

// Which date group a chat belongs to.
function groupOf(value: string) {
  const days = Math.round((startOfDay(new Date()) - startOfDay(new Date(value))) / DAY_MS);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days <= 7) return "Previous 7 days";
  return "Older";
}

const ORDER = ["Today", "Yesterday", "Previous 7 days", "Older"];

// Previous chats grouped by date.
export function RecentHistory() {
  const [recents, setRecents] = useState<Recent[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: chats, error } = await supabase
        .from("chats")
        .select("id, title, updated_at")
        .order("updated_at", { ascending: false })
        .limit(100);
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

  async function rename(id: string, title: string) {
    setBusy(true);
    const { error } = await createClient().from("chats").update({ title }).eq("id", id);
    setBusy(false);
    if (error) {
      toast.error("Couldn't rename that chat.");
      return;
    }
    setRecents((current) => current?.map((item) => (item.id === id ? { ...item, title } : item)) ?? null);
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

  const groups = ORDER.map((label) => ({
    label,
    items: recents.filter((item) => groupOf(item.updated_at) === label),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.label} className="space-y-3">
          <h2 className="text-muted-foreground text-sm font-medium">{group.label}</h2>
          <div className="space-y-2">
            {group.items.map((item) => (
              <RecentEntry key={item.id} recent={item} busy={busy} onRename={rename} onDelete={remove} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
