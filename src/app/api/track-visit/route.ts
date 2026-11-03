import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { recordMemoryVisit } from "@/lib/visitorTrackerStore";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { path = "/", sessionId, referrer, userEmail } = body;

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "";
    const activeSessionId = sessionId || `anon_${ip}_${Date.now()}`;

    // Record in-memory
    recordMemoryVisit({
      sessionId: activeSessionId,
      path: String(path).substring(0, 200),
      userEmail: userEmail ? String(userEmail).toLowerCase().trim() : undefined,
      timestamp: Date.now(),
    });

    // Attempt Supabase insert
    try {
      const supabase = getSupabaseAdmin();
      await supabase.from("oddora_v2_site_visits").insert({
        session_id: activeSessionId,
        path: String(path).substring(0, 200),
        referrer: referrer ? String(referrer).substring(0, 255) : null,
        user_agent: userAgent ? userAgent.substring(0, 255) : null,
        ip_hash: ip !== "unknown" ? ip.substring(0, 45) : null,
        user_email: userEmail ? String(userEmail).toLowerCase().trim() : null,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Non-blocking fallback
    }

    return NextResponse.json({ status: "success" });
  } catch (err: any) {
    return NextResponse.json({ status: "ok" });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "active",
  });
}
