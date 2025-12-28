import { createBrowserClient } from "@supabase/ssr"

// Use a global variable to ensure only one client instance across the entire app
declare global {
  var supabaseClient: ReturnType<typeof createBrowserClient> | undefined
}

export function createClient() {
  // Use global variable to persist across hot reloads
  if (globalThis.supabaseClient) {
    return globalThis.supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.",
    )
  }

  globalThis.supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  return globalThis.supabaseClient
}
