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
