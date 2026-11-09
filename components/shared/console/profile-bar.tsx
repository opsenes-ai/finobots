"use client";

import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LogOut, Settings } from "lucide-react";

export function ProfileBar() {
  const router = useRouter();

  return (
    <Popover>
      <PopoverTrigger className="rounded-full outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50">
        <Avatar size="sm">
          <AvatarImage src="" alt="User" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
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
