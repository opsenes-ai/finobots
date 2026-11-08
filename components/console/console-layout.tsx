import { Suspense } from "react";
import { ConsoleHeader } from "./console-header";
import { ConsoleSidebar } from "./console-sidebar";

export function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh">
      <Suspense fallback={<aside className="w-64 border-r" />}>
        <ConsoleSidebar />
      </Suspense>
      <div className="flex flex-1 flex-col">
        <ConsoleHeader />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
