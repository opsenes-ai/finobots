import Link from "next/link";

const legalLinks = [
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/cookies", label: "Cookies" },
];

export function AppFooter() {
  return (
    <footer className="border-t">
      <div className="flex flex-col items-center gap-3 px-4 py-4 sm:h-16 sm:flex-row sm:justify-between sm:gap-0 sm:px-6 sm:py-0">
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
