"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Rename and delete.
export function RecentActions({
  onRename,
  onDelete,
  disabled,
}: {
  onRename: () => void;
  onDelete: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button variant="ghost" size="icon-sm" aria-label="Rename chat" disabled={disabled} onClick={onRename}>
        <Pencil />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label="Delete chat" disabled={disabled} onClick={onDelete}>
        <Trash2 />
      </Button>
    </div>
  );
}
