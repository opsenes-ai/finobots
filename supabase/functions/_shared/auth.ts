import type { SupabaseClient } from "npm:@supabase/supabase-js@2.119.0";
import { createUserClient } from "./database.ts";
import { HttpError } from "./response.ts";

export type OrgRole = "owner" | "admin" | "member";

export type AuthContext = {
  userId: string;
  /** Acts as the user, so row level security applies. */
  client: SupabaseClient;
};

/** Rejects the request unless it carries a valid user session. */
export async function requireUser(req: Request): Promise<AuthContext> {
  const client = createUserClient(req);
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");

  // The function has no stored session, so the token is checked explicitly.
  const { data, error } = await client.auth.getClaims(token);
  const userId = data?.claims?.sub;

  if (error || !userId) {
    throw new HttpError(401, "You need to sign in.", "unauthorized");
  }

  return { userId, client };
}

/**
 * Rejects the request unless the user belongs to the organization, and,
 * when roles are given, holds one of them. Returns the user's role.
 */
export async function requireOrgMember(
  auth: AuthContext,
  organizationId: string,
  roles?: OrgRole[],
): Promise<OrgRole> {
  const { data, error } = await auth.client
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", auth.userId)
    .maybeSingle<{ role: OrgRole }>();

  // Missing and forbidden look the same, so ids of other workspaces don't leak.
  if (error || !data) {
    throw new HttpError(404, "Workspace not found.", "not_found");
  }
  if (roles && !roles.includes(data.role)) {
    throw new HttpError(403, "You don't have permission to do this.", "forbidden");
  }

  return data.role;
}
