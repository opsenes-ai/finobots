import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  return (
    <header className="border-b">
      <div className="flex h-16 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/icons/app/dark.png" alt="Finobots" width={28} height={28} />
          <span className="text-lg font-semibold">Finobots</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Link href="/auth/login">Login</Link>
          </Button>
          <Button size="sm">
            <Link href="/auth/signup">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
