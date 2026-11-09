import { Suspense } from "react";
import { ConsoleSidebar } from "./console-sidebar";

// ConsoleHeader (./console-header) is kept but not rendered for now.
export function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh">
      <Suspense fallback={<aside className="w-64 border-r" />}>
        <ConsoleSidebar />
      </Suspense>
      <div className="flex flex-1 flex-col">
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
