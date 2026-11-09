import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  ACTIVITY_COOKIE,
  IDLE_TIMEOUT_MS,
  SESSION_COOKIE,
  cookieOptions,
  isSessionValid,
} from '@/lib/auth/session'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims

  // proxy.ts only runs this for /console routes, so any request without a
  // session here is redirected to login.
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Session policy (see lib/auth/session.ts): 1 day normally, 30 days with
  // "remember me", and logged out after 1 day without activity.
  if (
    !isSessionValid(
      request.cookies.get(SESSION_COOKIE)?.value,
      request.cookies.get(ACTIVITY_COOKIE)?.value
    )
  ) {
    // scope "local" ends only this session, not the user's other devices.
    await supabase.auth.signOut({ scope: 'local' })

    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.search = ''
    const expired = NextResponse.redirect(url)
    // Carry over the auth cookies that signOut() just cleared.
    supabaseResponse.cookies
      .getAll()
      .forEach((cookie) => expired.cookies.set(cookie))
    expired.cookies.delete(SESSION_COOKIE)
    expired.cookies.delete(ACTIVITY_COOKIE)
    return expired
  }

  // Every console request extends the inactivity window.
  supabaseResponse.cookies.set(
    ACTIVITY_COOKIE,
    String(Date.now()),
    cookieOptions(IDLE_TIMEOUT_MS)
  )

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
