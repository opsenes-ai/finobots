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
