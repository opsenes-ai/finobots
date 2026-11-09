import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function AppHeader({ className }: { className?: string }) {
  return (
    <header className={cn("border-b bg-background", className)}>
      <div className="flex h-14 items-center justify-between px-4 sm:h-16 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/icons/app/dark.png" alt="Finobots" width={26} height={26} />
          <span className="text-base font-semibold sm:text-lg">Finobots</span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm">
            <Link href="/auth/login">Login</Link>
          </Button>
          <Button size="sm">
            <Link href="/auth/signup">
              <span className="hidden sm:inline">Get Started</span>
              <span className="sm:hidden">Start</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
