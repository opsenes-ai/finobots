"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { SettingsSidebar, SettingsSidebarFallback } from "./settings-sidebar";

// Settings shown as a dialog. It stays open while a settings page is the
// current route, and closing it returns to the chat page.
export function SettingsDialog({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) router.push("/console/chat");
      }}
    >
      {/* 56rem x 35rem: a 16:10 ratio, shrinking to fit smaller screens. */}
      <DialogContent className="flex h-[min(35rem,calc(100svh-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl sm:flex-row">
        <aside className="flex shrink-0 flex-col gap-3 border-b p-4 sm:w-56 sm:border-r sm:border-b-0">
          <div className="space-y-1">
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription className="sr-only">
              Manage your profile, data, security, notifications, and API
              access.
            </DialogDescription>
          </div>
          {/* The active section comes from the URL, known per request. */}
          <Suspense fallback={<SettingsSidebarFallback />}>
            <SettingsSidebar />
          </Suspense>
        </aside>
        <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
