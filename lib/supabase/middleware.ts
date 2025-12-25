import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If env vars are not available, just pass through without Supabase auth check
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log("[v0] Supabase env vars not available in middleware, skipping auth check")
    return supabaseResponse
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    })

    // Auth enforcement disabled - will use Clerk for authentication later
    // const {
    //   data: { user },
    // } = await supabase.auth.getUser()

    // Redirect to login if accessing protected routes without auth
    // if (!user && !request.nextUrl.pathname.startsWith("/auth") && request.nextUrl.pathname !== "/") {
    //   const url = request.nextUrl.clone()
    //   url.pathname = "/auth/login"
    //   return NextResponse.redirect(url)
    // }
  } catch (error) {
    console.error("[v0] Error in middleware:", error)
  }

  return supabaseResponse
}
