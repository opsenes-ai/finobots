import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section id="hero" className="mx-auto w-full max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-24">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
        Run your finances with AI.
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:mt-6 sm:text-lg">
        Manage invoices, payments, expenses, and cash flow through chat with an
        open-source AI agent.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row sm:justify-center">
        <Button size="lg" className="w-full sm:w-auto">
          <Link href="/auth/signup">Get Started</Link>
        </Button>
        <Button variant="outline" size="lg" className="w-full sm:w-auto">
          <Link href="https://github.com/opsenes-ai/finobots" target="_blank">
            View on GitHub
          </Link>
        </Button>
      </div>
    </section>
  );
}
