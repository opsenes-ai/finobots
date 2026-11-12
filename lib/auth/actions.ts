"use server";

import { cookies } from "next/headers";
import { ACTIVITY_COOKIE, SESSION_COOKIE, startSessionCookies } from "@/lib/auth/session";

/**
 * Starts the session policy window after a successful login.
 * remember = true keeps the session for 30 days, otherwise 1 day.
 */
export async function startSession(remember: boolean) {
  startSessionCookies(await cookies(), remember);
}

/** Clears the session policy cookies on sign out. */
export async function endSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(ACTIVITY_COOKIE);
}
