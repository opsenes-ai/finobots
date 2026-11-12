"use client";

import { useLayoutEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // Next.js keeps visited pages alive (hidden) and shows them again later, so
  // a "Signing in…" state left over from the last visit would come back stuck.
  // Reset it whenever the page is hidden.
  useLayoutEffect(() => {
    return () => {
      setLoading(false);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const redirectTo = `${window.location.origin}/auth/callback?next=/auth/reset`;

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Reset link sent", {
      description: "Check your email inbox.",
    });
    setSent(true);
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot password</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a reset link
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <p className="text-sm text-muted-foreground">
            Reset link sent. Check your email inbox.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link href="/auth/login" className="font-medium text-foreground hover:underline">Login</Link>
        </p>
      </CardFooter>
    </Card>
  );
}
