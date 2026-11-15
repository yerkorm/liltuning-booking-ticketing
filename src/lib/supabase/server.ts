import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Bound to the current user's session (via cookies) — RLS applies normally.
// Use this for everything the logged-in staff/admin does.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component render, which can't set
            // cookies — safe to ignore. This project has no Next.js
            // proxy/middleware (Next 16's proxy is Node.js-only, which
            // @opennextjs/cloudflare doesn't support yet — see README),
            // so unlike the common Supabase+Next.js setup there's no
            // per-request session refresh happening here. Refreshed
            // tokens DO get persisted whenever a Server Action or Route
            // Handler runs (those can set cookies), which covers most
            // admin interactions. Revisit once OpenNext supports Node.js
            // middleware and src/proxy.ts can come back.
          }
        },
      },
    }
  );
}

// Bypasses RLS entirely. Server-only (route handlers), never import from
// client components. Used for the public booking flow (no logged-in user)
// and the Mercado Pago webhook.
export function createServiceRoleClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    }
  );
}
