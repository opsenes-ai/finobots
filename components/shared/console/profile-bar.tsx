"use client";

import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LogOut, Settings } from "lucide-react";

// Full-width sidebar row, the same 4rem height as the Collapse row below it.
export function ProfileBar({ collapsed = false }: { collapsed?: boolean }) {
  const router = useRouter();

  return (
    <Popover>
      <PopoverTrigger
        aria-label="Profile"
        className={`flex h-16 w-full items-center border-t text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50 ${
          collapsed ? "justify-center" : "justify-start gap-3 px-6"
        }`}
      >
        <Avatar size="sm">
          <AvatarImage src="" alt="" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        {!collapsed && "Profile"}
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
