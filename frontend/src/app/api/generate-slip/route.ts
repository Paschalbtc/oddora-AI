import { NextRequest, NextResponse } from "next/server";
import { generateMathematicalAccumulatorSlip } from "@/lib/sportybet";
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
    const body = await request.json();
    const {
      target_odds = 10.0,
      timeframe = "today",
      bookmaker = "SportyBet",
      risk_level = "BALANCED",
      user_id = null,
      custom_rules = [],
      market_types = ["all"],
      selected_markets = null,
    } = body;

    const markets = selected_markets || market_types || ["all"];

    const slip = await generateMathematicalAccumulatorSlip({
      targetOdds: Number(target_odds),
      timeframe,
      bookmaker: bookmaker.toLowerCase().includes("bet9ja") ? "Bet9ja" : "SportyBet",
      riskLevel: risk_level,
      customRules: custom_rules,
      marketTypes: Array.isArray(markets) ? markets : [markets],
    });

    // Save generated slip to Supabase
    try {
      await (supabase as any).from("generated_slips").insert({
        user_id: user_id || null,
        bookmaker: slip.bookmaker,
        booking_code: slip.booking_code,
        target_odds_requested: slip.target_odds_requested,
        actual_combined_odds: slip.actual_combined_odds,
        duration: timeframe,
        legs_json: slip.legs,
      });
    } catch (e) {
      // Non-blocking log
    }

    return NextResponse.json({
      status: "success",
      message: `Generated verified ${slip.bookmaker} slip with ${slip.actual_combined_odds}x multiplied odds.`,
      slip,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ status: "error", message: errorMsg }, { status: 500 });
  }
}

