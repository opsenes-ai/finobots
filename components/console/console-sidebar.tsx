"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Plus, Settings } from "lucide-react";

const navItems = [
  { href: "/console/recents", label: "Recents", icon: Clock },
  { href: "/console/new", label: "New", icon: Plus },
  { href: "/console/settings", label: "Settings", icon: Settings },
];

export function ConsoleSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r">
      <div className="flex h-16 items-center gap-2.5 border-b px-6">
        <Image src="/icons/app/dark.png" alt="Finobots" width={28} height={28} />
        <span className="text-lg font-semibold">Finobots</span>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
