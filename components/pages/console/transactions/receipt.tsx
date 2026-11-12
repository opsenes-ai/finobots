"use client";

import { useRef, useState } from "react";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/client";
import { transactionsResource, useSelectedTransaction } from "./ledger";

const BUCKET = "user-uploads";
const MAX_BYTES = 10 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

// Attach a receipt to the selected transaction. Stored privately in your own folder.
export function TransactionReceipt({ className }: { className?: string }) {
  const { data, transaction } = useSelectedTransaction();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    if (!transaction) return;
    const extension = TYPES[file.type];
    if (!extension) {
      toast.error("Use a PDF, PNG, JPEG or WebP file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("The file must be 10 MB or smaller.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not signed in");
      const path = `${auth.user.id}/receipts/${transaction.id}-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      const { error } = await supabase.from("transactions").update({ receipt_path: path }).eq("id", transaction.id);
      if (error) throw error;
      if (transaction.receipt_path) await supabase.storage.from(BUCKET).remove([transaction.receipt_path]);
      toast.success("Receipt attached.");
      await transactionsResource.reload();
    } catch {
      toast.error("Couldn't attach the receipt. Try again.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function open() {
    if (!transaction?.receipt_path) return;
    const { data: signed } = await createClient().storage.from(BUCKET).createSignedUrl(transaction.receipt_path, 300);
    if (signed?.signedUrl) window.open(signed.signedUrl, "_blank", "noopener,noreferrer");
    else toast.error("Couldn't open the receipt. It may have been uploaded by someone else.");
  }

  async function remove() {
    if (!transaction?.receipt_path) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("transactions").update({ receipt_path: null }).eq("id", transaction.id);
    if (!error) await supabase.storage.from(BUCKET).remove([transaction.receipt_path]);
    setBusy(false);
    if (error) toast.error("Couldn't remove the receipt.");
    else await transactionsResource.reload();
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Receipt</CardTitle>
      </CardHeader>
      <CardContent>
        {!transaction ? (
          <p className="text-muted-foreground text-sm">
            {data === undefined ? "Loading…" : "Pick a transaction to attach a receipt."}
          </p>
        ) : (
          <div className="space-y-3">
            <input
              ref={input}
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              className="sr-only"
              tabIndex={-1}
              aria-label="Choose a receipt"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file);
              }}
            />
            {transaction.receipt_path ? (
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <FileText className="text-muted-foreground size-5 shrink-0" />
                <span className="min-w-0 flex-1 truncate text-sm">{transaction.receipt_path.split("/").pop()}</span>
                <Button size="sm" variant="outline" disabled={busy} onClick={open}>
                  View
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm">No receipt attached.</p>
            )}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={busy} onClick={() => input.current?.click()}>
                {busy ? "Uploading…" : transaction.receipt_path ? "Replace" : "Upload"}
              </Button>
              {transaction.receipt_path ? (
                <Button size="sm" variant="ghost" disabled={busy} onClick={remove}>
                  Remove
                </Button>
              ) : null}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
