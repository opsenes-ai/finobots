"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Database, KeyRound, Shield, User } from "lucide-react";
import { cn } from "@/lib/utils";

const settingsItems = [
  { href: "/console/settings/profile", label: "Profile", icon: User },
  { href: "/console/settings/data", label: "Data", icon: Database },
  { href: "/console/settings/security", label: "Security", icon: Shield },
  { href: "/console/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/console/settings/api", label: "API", icon: KeyRound },
];

function SettingsLinks({ activeHref }: { activeHref?: string }) {
  return (
    <nav
      aria-label="Settings"
      className="flex gap-1 overflow-x-auto [scrollbar-width:none] sm:flex-col sm:overflow-visible"
    >
      {settingsItems.map((item) => {
        const Icon = item.icon;
        const active = item.href === activeHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

// Highlights the section matching the current URL.
export function SettingsSidebar() {
  const pathname = usePathname();
  const activeHref = settingsItems.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )?.href;

  return <SettingsLinks activeHref={activeHref} />;
}

// Same links with none highlighted, shown until the URL is known.
export function SettingsSidebarFallback() {
  return <SettingsLinks />;
}
