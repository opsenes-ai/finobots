"use client";

import { Suspense, use, useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/auth/profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Gauge, KeyRound, LogOut, MessageSquare, Sparkles, User } from "lucide-react";

const FALLBACK_NAME = "Profile";
const FEEDBACK_URL = "https://tally.so/r/1WdJ6g";

// Two-letter initials: first letter of the first two words ("Jane Doe" -> "JD"),
// or the first two letters of a single word ("test" -> "TE").
function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    words.length >= 2
      ? Array.from(words[0])[0] + Array.from(words[1])[0]
      : Array.from(words[0] ?? "").slice(0, 2).join("");
  return letters.toUpperCase();
}

function Identity({
  name,
  avatarUrl,
  collapsed,
}: {
  name: string;
  avatarUrl?: string | null;
  collapsed: boolean;
}) {
  return (
    <>
      <Avatar size="sm">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
        <AvatarFallback>{getInitials(name)}</AvatarFallback>
      </Avatar>
      {!collapsed && <span className="truncate">{name}</span>}
    </>
  );
}

// Shown while the profile loads: an avatar circle and a name bar.
function IdentitySkeleton({ collapsed }: { collapsed: boolean }) {
  return (
    <>
      <Skeleton aria-hidden className="size-6 shrink-0 rounded-full" />
      {!collapsed && <Skeleton aria-hidden className="h-3 w-24" />}
    </>
  );
}

// Waits for the profile loaded on the server (lib/auth/profile.ts).
function ProfileIdentity({
  profilePromise,
  collapsed,
}: {
  profilePromise: Promise<Profile | null>;
  collapsed: boolean;
}) {
  const profile = use(profilePromise);
  // Full name first, then username, then a generic label.
  const name =
    profile?.full_name?.trim() || profile?.username?.trim() || FALLBACK_NAME;

  return (
    <Identity name={name} avatarUrl={profile?.avatar_url} collapsed={collapsed} />
  );
}

// Full-width sidebar row, the same 4rem height as the Collapse row below it.
export function ProfileBar({
  collapsed = false,
  profilePromise,
}: {
  collapsed?: boolean;
  profilePromise: Promise<Profile | null>;
}) {
  const router = useRouter();
  // Controlled so picking an item closes the popup. Clicking outside or
  // clicking the profile row again also closes it.
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label="Profile menu"
        className={`flex h-16 w-full items-center border-t text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50 ${
          collapsed ? "justify-center" : "justify-start gap-3 px-6"
        }`}
      >
        {/* A neutral placeholder while the name loads, so no wrong name shows. */}
        <Suspense fallback={<IdentitySkeleton collapsed={collapsed} />}>
          <ProfileIdentity
            profilePromise={profilePromise}
            collapsed={collapsed}
          />
        </Suspense>
      </PopoverTrigger>
      {/* Opens upward, since the trigger sits at the bottom of the sidebar. */}
      {/* Centred over the sidebar with equal space on both sides: the width is
          the trigger's (the sidebar's) minus 0.75rem a side. */}
      <PopoverContent
        side="top"
        align="center"
        sideOffset={8}
        className="w-[calc(var(--anchor-width)-1.5rem)] min-w-48 gap-0.5 p-1.5"
      >
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            router.push("/console/settings/profile");
          }}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm outline-none transition-colors hover:bg-muted"
        >
          <User className="size-4" />
          Profile
        </button>
        <div role="separator" aria-orientation="horizontal" className="-mx-1.5 my-1 h-px bg-border" />
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            router.push("/console/settings/personalization");
          }}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm outline-none transition-colors hover:bg-muted"
        >
          <Sparkles className="size-4" />
          Personalization
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            router.push("/console/settings/usage");
          }}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm outline-none transition-colors hover:bg-muted"
        >
          <Gauge className="size-4" />
          Usage
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            router.push("/console/settings/api");
          }}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm outline-none transition-colors hover:bg-muted"
        >
          <KeyRound className="size-4" />
          API
        </button>
        <div role="separator" aria-orientation="horizontal" className="-mx-1.5 my-1 h-px bg-border" />
        {/* Opens the feedback form in a new tab. */}
        <a
          href={FEEDBACK_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setOpen(false)}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm outline-none transition-colors hover:bg-muted"
        >
          <MessageSquare className="size-4" />
          Feedback
          <span className="sr-only">(opens in a new tab)</span>
        </a>
        <div role="separator" aria-orientation="horizontal" className="-mx-1.5 my-1 h-px bg-border" />
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            router.push("/auth/login");
          }}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </PopoverContent>
    </Popover>
  );
}
