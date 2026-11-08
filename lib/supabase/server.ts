import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export function authConfigured() {
  return Boolean(
    process.env.SUPABASE_URL?.trim() &&
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim(),
  );
}
export function publicSignupEnabled() {
  return authConfigured() && process.env.PUBLIC_SIGNUP_ENABLED === "true";
}
export async function serverSupabase() {
  if (!authConfigured())
    throw new Error("Account storage has not been configured.");
  const jar = await cookies();
  return createServerClient(
    process.env.SUPABASE_URL!.trim(),
    process.env.SUPABASE_PUBLISHABLE_KEY!.trim(),
    {
      cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      },
      cookies: {
        getAll: () => jar.getAll(),
        setAll(values) {
          for (const { name, value, options } of values) {
            try {
              jar.set(name, value, options);
            } catch {
              /* Server components cannot refresh cookies; route handlers can. */
            }
          }
        },
      },
    },
  );
}
export async function verifiedAccount() {
  if (!authConfigured()) return null;
  try {
    const client = await serverSupabase();
    const { data, error } = await client.auth.getUser();
    return error || !data.user ? null : { client, user: data.user };
  } catch {
    return null;
  }
}
