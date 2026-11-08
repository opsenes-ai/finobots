import { ProfileBar } from "@/components/shared/console";

export function ConsoleHeader() {
  return (
    <header className="border-b">
      <div className="flex h-16 items-center justify-end px-6">
        <ProfileBar />
      </div>
    </header>
  );
}
