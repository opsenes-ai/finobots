import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section id="hero" className="mx-auto w-full max-w-5xl px-6 py-24 text-center">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
        Run your finances with AI.
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
        Manage invoices, payments, expenses, and cash flow through chat with an
        open-source AI agent.
      </p>
      <div className="mt-10 flex items-center justify-center gap-3">
        <Button size="lg">
          <Link href="/auth/signup">Get Started</Link>
        </Button>
        <Button variant="outline" size="lg">
          <Link href="https://github.com/opsenes-ai/finobots" target="_blank">
            View on GitHub
          </Link>
        </Button>
      </div>
    </section>
  );
}
