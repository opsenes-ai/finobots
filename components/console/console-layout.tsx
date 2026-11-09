import { Suspense } from "react";
import { getProfile } from "@/lib/auth/profile";
import { ConsoleSidebar } from "./console-sidebar";

// ConsoleHeader (./console-header) is kept but not rendered for now.
export function ConsoleLayout({ children }: { children: React.ReactNode }) {
  // Start loading the profile on the server; the sidebar shows straight away
  // and the name streams in when the promise resolves.
  const profilePromise = getProfile();

  return (
    <div className="flex min-h-svh">
      {/* Matches the collapsed sidebar width, so the layout doesn't shift. */}
      <Suspense fallback={<aside className="w-16 border-r" />}>
        <ConsoleSidebar profilePromise={profilePromise} />
      </Suspense>
      <div className="flex flex-1 flex-col">
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
