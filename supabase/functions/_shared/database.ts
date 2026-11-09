import { createClient } from "npm:@supabase/supabase-js@2.119.0";
import { HttpError } from "./response.ts";

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

/**
 * A client that acts as the signed-in user, using the request's
 * Authorization header. Row level security applies to every query.
 * Use this by default.
 */
export function createUserClient(req: Request) {
  const authorization = req.headers.get("Authorization");
  if (!authorization) {
    throw new HttpError(401, "You need to sign in.", "unauthorized");
  }

  return createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * A service-role client that bypasses row level security. Only for work
 * no user can do directly, such as reading connection_credentials or
 * handling webhooks. Check access yourself before using it for a user.
 */
export function createAdminClient() {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
