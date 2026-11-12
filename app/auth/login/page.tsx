"use client";

import { useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/client";
import { startSession } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// The shared demo account, filled in so visitors can sign in straight away.
// Anyone can clear the fields and use their own account instead.
const DEMO_EMAIL = "demo@finobots.com";
const DEMO_PASSWORD = "Password@123";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const [paypalLoading, setPaypalLoading] = useState(false);

  // Next.js keeps visited pages alive (hidden) and shows them again later, so
  // a "Signing in…" state left over from the last visit would come back stuck.
  // Reset it whenever the page is hidden.
  useLayoutEffect(() => {
    return () => {
      setLoading(false);
      setPaypalLoading(false);
    };
  }, []);

  // Redirects to PayPal, then back through /auth/callback. Uses the
  // "custom:paypal" provider configured in Supabase Auth.
  async function handlePayPal() {
    setPaypalLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "custom:paypal",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      toast.error("PayPal sign-in isn't available right now.");
      setPaypalLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.code === "email_not_confirmed") {
        toast.error("Please verify your email first.", {
          description: "Check your inbox for the confirmation link.",
        });
      } else if (error.code === "invalid_credentials") {
        toast.error("Invalid email or password.", {
          action: {
            label: "Create account",
            onClick: () => router.push("/auth/signup"),
          },
        });
      } else {
        toast.error(error.message);
      }
      setLoading(false);
      return;
    }

    // 1 day normally, 30 days when "Remember me" is ticked.
    await startSession(remember);
    router.push("/console/chat");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              defaultValue={DEMO_EMAIL}
              autoComplete="email"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/auth/forgot" className="text-sm text-muted-foreground hover:text-foreground">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                defaultValue={DEMO_PASSWORD}
                autoComplete="current-password"
                required
                className="pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={remember}
              onCheckedChange={(checked) => setRemember(checked)}
            />
            <Label htmlFor="remember" className="text-sm font-normal">Remember me</Label>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handlePayPal}
          disabled={paypalLoading}
        >
          <Image
            src="/connections/paypal.png"
            alt=""
            width={16}
            height={16}
            style={{ width: 16, height: "auto" }}
          />
          {paypalLoading ? "Redirecting…" : "Continue with PayPal"}
        </Button>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="font-medium text-foreground hover:underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
