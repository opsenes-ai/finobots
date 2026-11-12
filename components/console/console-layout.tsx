import { Suspense } from "react";
import { getProfile } from "@/lib/auth/profile";
import { ConsoleSidebar } from "./console-sidebar";

// ConsoleHeader (./console-header) is kept but not rendered for now.
export function ConsoleLayout({ children }: { children: React.ReactNode }) {
  // Start loading the profile on the server; the sidebar shows straight away
  // and the name streams in when the promise resolves.
  const profilePromise = getProfile();

  return (
    // Locked to the screen height: the sidebar stays fixed and only the page
    // content scrolls, using the light scrollbar from globals.css.
    // `fixed inset-0` pins it to the viewport, so nothing inside can make the
    // window itself scroll. `relative` on <main> keeps absolutely positioned
    // children (such as visually hidden file inputs) inside the scroll area,
    // instead of stretching the document below the screen.
    <div className="fixed inset-0 flex overflow-hidden">
      {/* Matches the collapsed sidebar width, so the layout doesn't shift. */}
      <Suspense fallback={<aside className="w-16 shrink-0 border-r" />}>
        <ConsoleSidebar profilePromise={profilePromise} />
      </Suspense>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <main className="relative min-h-0 flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
