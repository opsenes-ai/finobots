"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RecentActions } from "./actions";

export type Recent = {
  id: string;
  title: string;
  updated_at: string;
};

function formatTime(value: string) {
  const date = new Date(value);
  const sameDay = date.toDateString() === new Date().toDateString();
  return sameDay
    ? date.toLocaleTimeString(undefined, { timeStyle: "short" })
    : date.toLocaleDateString(undefined, { dateStyle: "medium" });
}

// Chat title, preview, and timestamp.
export function RecentEntry({
  recent,
  busy,
  onRename,
  onDelete,
}: {
  recent: Recent;
  busy: boolean;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(recent.title);
  const [confirming, setConfirming] = useState(false);

  if (renaming) {
    return (
      <form
        className="bg-card flex items-center gap-2 rounded-lg border p-3"
        onSubmit={(event) => {
          event.preventDefault();
          const next = title.trim();
          if (next && next !== recent.title) onRename(recent.id, next);
          setRenaming(false);
        }}
      >
        <Input
          aria-label="Chat title"
          autoFocus
          maxLength={200}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <Button type="submit" size="sm">
          Save
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setTitle(recent.title);
            setRenaming(false);
          }}
        >
          Cancel
        </Button>
      </form>
    );
  }

  if (confirming) {
    return (
      <div className="bg-card flex items-center justify-between gap-3 rounded-lg border border-destructive/40 p-4">
        <p className="min-w-0 truncate text-sm">Delete &ldquo;{recent.title}&rdquo;?</p>
        <div className="flex shrink-0 gap-2">
          <Button variant="destructive" size="sm" disabled={busy} onClick={() => onDelete(recent.id)}>
            Delete
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card hover:bg-muted/40 flex items-center gap-4 rounded-lg border p-4 transition-colors">
      <Link href={`/console/chat/${recent.id}`} className="min-w-0 flex-1 outline-none focus-visible:underline">
        <div className="flex items-center justify-between gap-4">
          <p className="truncate text-sm font-medium">{recent.title}</p>
          <time dateTime={recent.updated_at} className="text-muted-foreground shrink-0 text-xs">
            {formatTime(recent.updated_at)}
          </time>
        </div>
      </Link>
      <RecentActions disabled={busy} onRename={() => setRenaming(true)} onDelete={() => setConfirming(true)} />
    </div>
  );
}
