import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/server";
import { startSessionCookies } from "@/lib/auth/session";

const PAYPAL_PROVIDER = "custom:paypal";
const DEFAULT_NEXT = "/console/chat";

// Only same-site paths, so a crafted link can't redirect to another site.
// Rejects "//host", "/\host", and anything not starting with "/".
function safeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return DEFAULT_NEXT;
  }
  return next;
}

// True when this PayPal sign-in was just linked to an account that already
// existed under the same email. Supabase links identities that share a
// verified email, so no duplicate account is created; this only tells the
// user what happened.
function joinedExistingAccount(user: User): boolean {
  const paypal = user.identities?.find((identity) => identity.provider === PAYPAL_PROVIDER);
  if (!paypal?.created_at || !user.created_at) return false;

  const linkedAt = new Date(paypal.created_at).getTime();
  const accountCreatedAt = new Date(user.created_at).getTime();
  const justLinked = Date.now() - linkedAt < 2 * 60 * 1000;
  return justLinked && linkedAt - accountCreatedAt > 60 * 1000;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Email links and PayPal sign-ins count as a normal (1 day) login.
      startSessionCookies(await cookies(), false);

      const destination = new URL(next, origin);
      if (data.user && joinedExistingAccount(data.user)) {
        destination.searchParams.set("notice", "paypal-linked");
      }
      return NextResponse.redirect(destination);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
}
