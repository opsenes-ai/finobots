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

const navItems = [
  { href: "/console/new", label: "New Chat", icon: Plus },
  { href: "/console/recents", label: "Recents", icon: Clock },
  { href: "/console/accounts", label: "Accounts", icon: Wallet },
  { href: "/console/cashflow", label: "Cashflow", icon: TrendingUp },
  { href: "/console/transaction", label: "Transactions", icon: Receipt },
  { href: "/console/connections", label: "Connections", icon: LinkIcon },
];

export function ConsoleSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex flex-col border-r transition-all ${
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
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className={`mt-auto flex h-16 w-full items-center border-t text-sm font-medium text-muted-foreground transition-colors hover:text-foreground ${
          collapsed ? "justify-center" : "justify-start gap-3 px-6"
        }`}
      >
        {collapsed ? (
          <PanelLeftOpen className="size-4 shrink-0" />
        ) : (
          <>
            <PanelLeftClose className="size-4 shrink-0" />
            Collapse
          </>
        )}
      </button>
    </aside>
  );
}
