import { NextResponse } from "next/server";
import { authConfigured, serverSupabase } from "../../../lib/supabase/server";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code && authConfigured()) {
    const client = await serverSupabase();
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) {
      const target =
        url.searchParams.get("next") === "/reset-password"
          ? "/reset-password"
          : "/app/dashboard";
      const response = NextResponse.redirect(new URL(target, url.origin));
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }
  }
  return NextResponse.redirect(
    new URL("/sign-in?message=confirmation-failed", url.origin),
  );
}
