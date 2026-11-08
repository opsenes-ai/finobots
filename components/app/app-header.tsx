import Image from "next/image";

export function AppHeader() {
  return (
    <header className="border-b">
      <div className="flex h-16 items-center gap-2.5 px-6">
        <Image src="/icons/app/dark.png" alt="Finobots" width={28} height={28} />
        <span className="text-lg font-semibold">Finobots</span>
      </div>
    </header>
  );
}
