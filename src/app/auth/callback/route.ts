import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = getSupabaseClient();
    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch (e) {
      console.warn("Auth callback session exchange notice:", e);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
