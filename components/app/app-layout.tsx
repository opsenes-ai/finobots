import { AppHeader } from "./app-header";
import { AppFooter } from "./app-footer";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader />
      <main className="flex-1">{children}</main>
      <AppFooter />
    </div>
  );
}
