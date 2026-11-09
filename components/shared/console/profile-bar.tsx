"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LogOut, Settings } from "lucide-react";

type Profile = {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

// Loads the signed-in user's own profile row. Row level security limits the
// query to that row, and it re-runs when the session changes.
function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (active) setProfile(null);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("full_name, username, avatar_url")
        .eq("id", user.id)
        .maybeSingle<Profile>();

      if (active) setProfile(data);
    };

    load();
    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return profile;
}

// Full-width sidebar row, the same 4rem height as the Collapse row below it.
export function ProfileBar({ collapsed = false }: { collapsed?: boolean }) {
  const router = useRouter();
  const profile = useProfile();

  // Full name first, then username, then a generic label while loading.
  const name =
    profile?.full_name?.trim() || profile?.username?.trim() || "Profile";
  const initial = name.charAt(0).toUpperCase();

  return (
    <Popover>
      <PopoverTrigger
        aria-label={`Profile: ${name}`}
        className={`flex h-16 w-full items-center border-t text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50 ${
          collapsed ? "justify-center" : "justify-start gap-3 px-6"
        }`}
      >
        <Avatar size="sm">
          {profile?.avatar_url ? (
            <AvatarImage src={profile.avatar_url} alt="" />
          ) : null}
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
        {!collapsed && <span className="truncate">{name}</span>}
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
