import Link from "next/link";
import { AppLayout } from "@/components/app";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <AppLayout>
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <p className="text-sm font-medium text-primary">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex items-center gap-3">
          <Button>
            <Link href="/">Go home</Link>
          </Button>
          <Button variant="outline">
            <Link href="/auth/login">Login</Link>
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
