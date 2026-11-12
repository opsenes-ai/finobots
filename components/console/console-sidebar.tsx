"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clock,
  Plus,
  Wallet,
  TrendingUp,
  Link as LinkIcon,
  Receipt,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import type { Profile } from "@/lib/auth/profile";
import { ProfileBar } from "@/components/shared/console";

const navItems = [
  { href: "/console/chat", label: "New Chat", icon: Plus },
  { href: "/console/recents", label: "Recents", icon: Clock },
  { href: "/console/accounts", label: "Accounts", icon: Wallet },
  { href: "/console/cashflow", label: "Cashflow", icon: TrendingUp },
  { href: "/console/transaction", label: "Transactions", icon: Receipt },
  { href: "/console/connections", label: "Connections", icon: LinkIcon },
];

export function ConsoleSidebar({
  profilePromise,
}: {
  profilePromise: Promise<Profile | null>;
}) {
  const pathname = usePathname();
  // Collapsed by default, and collapsed again whenever a page is opened.
  const [collapsed, setCollapsed] = useState(true);

  return (
    <aside
      className={`flex h-full shrink-0 flex-col overflow-y-auto border-r transition-all ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div
        className={`flex h-16 items-center ${
          collapsed ? "justify-center" : "gap-2.5 px-6"
        }`}
      >
        <Image src="/icons/app/dark.png" alt="Finobots" width={28} height={28} />
        {!collapsed && <span className="text-lg font-semibold">Finobots</span>}
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          const isNewChat = item.href === "/console/new";
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setCollapsed(true)}
              title={collapsed ? item.label : undefined}
              className={`flex items-center rounded-lg text-sm font-medium transition-colors ${
                collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2"
              } ${
                active
                  ? "bg-muted text-foreground"
                  : isNewChat
                    ? "bg-primary text-primary-foreground hover:bg-primary/80"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto">
        <ProfileBar collapsed={collapsed} profilePromise={profilePromise} />
      </div>
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className={`flex h-12 w-full items-center border-t text-sm font-medium text-muted-foreground transition-colors hover:text-foreground ${
          collapsed ? "justify-center" : "justify-start gap-3 px-6"
        }`}
      >
        {collapsed ? (
          <PanelLeftOpen className="size-4 shrink-0" />
        ) : (
          <>
            <PanelLeftClose className="size-4 shrink-0" />
            collapse menu
          </>
        )}
      </button>
    </aside>
  );
}
