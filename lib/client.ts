import { useEffect, useSyncExternalStore } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}

// The signed-in user's workspace id, or null if they don't have one yet.
export async function getWorkspaceId() {
  const { data } = await createClient().rpc('my_workspace')
  const rows = data as { organization_id: string }[] | null
  return rows?.[0]?.organization_id ?? null
}

// The message an edge function sent back with an error, if there is one.
export async function functionErrorMessage(error: unknown): Promise<string> {
  const context = (error as { context?: Response })?.context
  if (context && typeof context.json === 'function') {
    try {
      const body = await context.json()
      const message = body?.error?.message ?? body?.message
      if (typeof message === 'string') return message
    } catch {
      // Fall through to the generic message.
    }
  }
  return 'Something went wrong. Try again.'
}

// ---------------------------------------------------------------------------
// Shared client state. Lets several cards on one page use the same data and
// selection without each fetching it.
// ---------------------------------------------------------------------------

/** A value any component can read and set. Updates re-render every reader. */
export function createStore<T>(initial: T) {
  let value = initial
  const listeners = new Set<() => void>()
  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }
  return {
    get: () => value,
    set(next: T) {
      value = next
      listeners.forEach((listener) => listener())
    },
    use: () => useSyncExternalStore(subscribe, () => value, () => initial),
  }
}

// Data older than this is fetched again when a page opens.
const STALE_MS = 30_000

/**
 * Data loaded once and shared. `use()` returns undefined until the first
 * load finishes. The loader should catch its own errors and return a
 * fallback, so a failure never leaves readers loading forever.
 */
export function createResource<T>(loader: () => Promise<T>) {
  const store = createStore<T | undefined>(undefined)
  let pending: Promise<void> | null = null
  let loadedAt = 0

  function reload() {
    pending ??= loader()
      .then((value) => {
        loadedAt = Date.now()
        store.set(value)
      })
      .finally(() => {
        pending = null
      })
    return pending
  }

  return {
    reload,
    get: store.get,
    use() {
      const value = store.use()
      useEffect(() => {
        if (Date.now() - loadedAt > STALE_MS) void reload()
      }, [])
      return value
    },
  }
}

/** Calls an edge function. Returns the data, or the function's error message. */
export async function callFunction<T>(
  name: string,
  body: Record<string, unknown>
): Promise<{ data: T | null; error: string | null }> {
  const { data, error } = await createClient().functions.invoke(name, { body })
  if (error) return { data: null, error: await functionErrorMessage(error) }
  // Functions reply with { data: ... }.
  return { data: ((data as { data?: T } | null)?.data ?? null) as T | null, error: null }
}
