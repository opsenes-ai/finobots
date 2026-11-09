"use server";

import { cookies } from "next/headers";
import { startSessionCookies } from "@/lib/auth/session";

/**
 * Starts the session policy window after a successful login.
 * remember = true keeps the session for 30 days, otherwise 1 day.
 */
export async function startSession(remember: boolean) {
  startSessionCookies(await cookies(), remember);
}
