import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fdlbnftfylcsjuzqbeuo.supabase.co";
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkbGJuZnRmeWxjc2p1enFiZXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1OTc0NjIsImV4cCI6MjEwODE3MzQ2Mn0.svZdujPkzWNdLm-mJ5XEM8S37JP5euHyoZ5YSt7tRz4";

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

export async function POST(request: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Body may be empty
    }

    // Optional proxy to local Python backend if available
    const backendUrl = process.env.BACKEND_URL;
    if (backendUrl) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(`${backendUrl}/api/admin/trigger-midnight`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          return NextResponse.json(data);
        }
      } catch {
        // Fall back to serverless Supabase grading
      }
    }

    const { getOrComputeMidnightAutopsy } = await import("../../midnight-autopsy/route");
    const autopsy = await getOrComputeMidnightAutopsy(true);

    return NextResponse.json({
      status: "success",
      message: `Midnight Autopsy & Grading successfully completed for ${autopsy.date}.`,
      date: autopsy.date,
      summary: {
        graded: autopsy.summary_stats.total_graded_predictions,
        won: autopsy.summary_stats.won_predictions,
        lost: autopsy.summary_stats.lost_predictions,
        win_rate: `${autopsy.summary_stats.win_rate_percentage}%`,
        win_rate_delta: autopsy.summary_stats.win_rate_delta,
        evolution_level: autopsy.summary_stats.evolution_level,
      },
      ready_slips_graded: autopsy.yesterday_ready_slips.length,
      calibrated_weights: autopsy.calibrated_weights,
      source: "Vercel Serverless + Supabase Cloud Engine",
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ status: "error", message: errorMsg }, { status: 500 });
  }
}
