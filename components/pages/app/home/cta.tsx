import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section id="cta" className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="rounded-xl bg-primary px-6 py-12 text-center sm:px-8 sm:py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-primary-foreground sm:text-3xl">
          Put AI to work on your finances.
        </h2>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button variant="secondary" size="lg" className="w-full sm:w-auto">
            <Link href="/auth/signup">Get Started</Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 sm:w-auto"
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
