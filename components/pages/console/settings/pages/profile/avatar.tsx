"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/client";

const MAX_BYTES = 2 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    words.length >= 2
      ? Array.from(words[0])[0] + Array.from(words[1])[0]
      : Array.from(words[0] ?? "").slice(0, 2).join("");
  return letters.toUpperCase() || "?";
}

// Profile picture upload. Pictures live in the private avatars bucket.
export function ProfileAvatar() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [path, setPath] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function show(nextPath: string | null) {
    setPath(nextPath);
    if (!nextPath) {
      setUrl(null);
      return;
    }
    const { data } = await createClient().storage.from("avatars").createSignedUrl(nextPath, 3600);
    setUrl(data?.signedUrl ?? null);
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      setUserId(auth.user.id);
      const { data } = await supabase
        .from("profiles")
        .select("full_name, username, avatar_url")
        .eq("id", auth.user.id)
        .maybeSingle();
      setName(data?.full_name || data?.username || "");
      await show(data?.avatar_url ?? null);
    }
    void load();
  }, []);

  async function save(nextPath: string | null) {
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: nextPath })
      .eq("id", userId!);
    if (error) throw error;
    await show(nextPath);
    router.refresh();
  }

  async function upload(file: File) {
    const extension = TYPES[file.type];
    if (!extension) {
      toast.error("Use a PNG, JPEG or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("The image must be 2 MB or smaller.");
      return;
    }
    if (!userId) return;

    setBusy(true);
    try {
      const supabase = createClient();
      const nextPath = `${userId}/avatar-${Date.now()}.${extension}`;
      const { error } = await supabase.storage.from("avatars").upload(nextPath, file, {
        contentType: file.type,
      });
      if (error) throw error;

      const previous = path;
      await save(nextPath);
      if (previous) await supabase.storage.from("avatars").remove([previous]);
      toast.success("Picture updated.");
    } catch {
      toast.error("Couldn't upload the picture. Try again.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function remove() {
    if (!path) return;
    setBusy(true);
    try {
      const previous = path;
      await save(null);
      await createClient().storage.from("avatars").remove([previous]);
      toast.success("Picture removed.");
    } catch {
      toast.error("Couldn't remove the picture. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Avatar</h3>
      <div className="flex items-center gap-4">
        <Avatar className="size-16 text-lg">
          {url ? <AvatarImage src={url} alt="" /> : null}
          <AvatarFallback className="text-lg">{initials(name)}</AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              ref={input}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              aria-label="Choose a profile picture"
              tabIndex={-1}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={busy || !userId}
              onClick={() => input.current?.click()}
            >
              {busy ? "Working…" : path ? "Change" : "Upload"}
            </Button>
            {path ? (
              <Button variant="ghost" size="sm" disabled={busy} onClick={remove}>
                Remove
              </Button>
            ) : null}
          </div>
          <p className="text-muted-foreground text-xs">PNG, JPEG or WebP, up to 2 MB.</p>
        </div>
      </div>
    </section>
  );
}
