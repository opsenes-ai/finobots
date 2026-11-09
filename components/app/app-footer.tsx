import Link from "next/link";

const legalLinks = [
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/cookies", label: "Cookies" },
];

export function AppFooter() {
  return (
    <footer className="border-t">
      <div className="flex h-16 items-center justify-between px-6">
        <span className="text-sm text-muted-foreground">&copy; 2026 Finobots</span>
        <nav className="flex items-center gap-4">
          {legalLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
