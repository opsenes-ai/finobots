import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { startSessionCookies } from "@/lib/auth/session";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/console/chat";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Signing in from an email link counts as a normal (1 day) login.
      startSessionCookies(await cookies(), false);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
}
