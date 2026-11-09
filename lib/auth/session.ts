// Session policy, enforced in proxy.ts for /console routes.
//
// - Normal login:   session lasts 1 day.
// - Remember me:    session lasts 30 days.
// - Inactivity:     a session with no activity for 1 day is ended.
//
// Two httpOnly cookies carry the policy:
// - fb_session  "<startedAt>:<remember 0|1>"  set at login, never extended.
// - fb_active   "<lastActiveAt>"              refreshed on every console request.
// Each cookie's maxAge matches its rule, and the stored timestamps are checked
// on the server as well, so an expired cookie that is replayed is still rejected.

export const SESSION_COOKIE = "fb_session";
export const ACTIVITY_COOKIE = "fb_active";

const DAY_MS = 24 * 60 * 60 * 1000;

export const SESSION_LIFETIME_MS = DAY_MS;
export const REMEMBER_LIFETIME_MS = 30 * DAY_MS;
export const IDLE_TIMEOUT_MS = DAY_MS;

export function cookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(maxAgeMs / 1000),
  };
}

type CookieWriter = {
  set(
    name: string,
    value: string,
    options: ReturnType<typeof cookieOptions>
  ): unknown;
};

/** Call right after a successful login to start a new policy window. */
export function startSessionCookies(
  store: CookieWriter,
  remember: boolean,
  now = Date.now()
) {
  const lifetime = remember ? REMEMBER_LIFETIME_MS : SESSION_LIFETIME_MS;
  store.set(
    SESSION_COOKIE,
    `${now}:${remember ? 1 : 0}`,
    cookieOptions(lifetime)
  );
  store.set(ACTIVITY_COOKIE, String(now), cookieOptions(IDLE_TIMEOUT_MS));
}

/** True while the session is inside both its lifetime and the idle window. */
export function isSessionValid(
  sessionValue: string | undefined,
  activityValue: string | undefined,
  now = Date.now()
) {
  if (!sessionValue || !activityValue) return false;

  const [startedRaw, rememberRaw] = sessionValue.split(":");
  const startedAt = Number(startedRaw);
  const lastActiveAt = Number(activityValue);
  if (!Number.isFinite(startedAt) || !Number.isFinite(lastActiveAt)) {
    return false;
  }

  const lifetime = rememberRaw === "1" ? REMEMBER_LIFETIME_MS : SESSION_LIFETIME_MS;
  return now - startedAt < lifetime && now - lastActiveAt < IDLE_TIMEOUT_MS;
}
