import { type NextRequest, NextResponse } from "next/server";

import { getSafeAuthDestination } from "@/lib/auth/oauth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const destination = getSafeAuthDestination(
    request.nextUrl.searchParams.get("next"),
  );

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(destination, request.nextUrl.origin));
    }
  }

  const loginUrl = new URL("/login", request.nextUrl.origin);
  loginUrl.searchParams.set("error", "oauth_callback");
  return NextResponse.redirect(loginUrl);
}
