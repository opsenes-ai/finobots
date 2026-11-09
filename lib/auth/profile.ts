import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@/lib/server";

export type Profile = {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

/**
 * The signed-in user's own profile, read on the server.
 *
 * "use cache: private" is the cache that may read cookies(): the Supabase
 * client takes the session from the auth cookies, and row level security
 * then limits the query to the user's own row. Private results are never
 * stored in a shared server cache, so one user's profile can't be served to
 * another. Within a request the result is reused, and the client router keeps
 * it for `stale` seconds.
 */
export async function getProfile(): Promise<Profile | null> {
  "use cache: private";
  cacheLife({ stale: 60 });
  cacheTag("profile");

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return null;

  const { data } = await supabase
    .from("profiles")
    .select("full_name, username, avatar_url")
    .eq("id", userId)
    .maybeSingle<Profile>();

  return data;
}
