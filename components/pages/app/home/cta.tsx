import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section id="cta" className="mx-auto w-full max-w-5xl px-6 py-24">
      <div className="rounded-xl bg-primary px-8 py-16 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-primary-foreground">
          Put AI to work on your finances.
        </h2>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button variant="secondary" size="lg">
            <Link href="/auth/signup">Get Started</Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Link href="https://github.com/opsenes-ai/finobots" target="_blank">
              View on GitHub
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
