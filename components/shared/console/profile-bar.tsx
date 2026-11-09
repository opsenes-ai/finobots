"use client";

import { Suspense, use } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/auth/profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LogOut, Settings } from "lucide-react";

const FALLBACK_NAME = "Profile";

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

  return (
    <Popover>
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
      <PopoverContent side="top" align="start" sideOffset={8} className="w-48 p-1.5">
        <button
          type="button"
          onClick={() => router.push("/console/settings")}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm outline-none transition-colors hover:bg-muted"
        >
          <Settings className="size-4" />
          Settings
        </button>
        <button
          type="button"
          onClick={() => router.push("/auth/login")}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </PopoverContent>
    </Popover>
  );
}
