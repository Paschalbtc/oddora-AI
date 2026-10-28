import { NextRequest, NextResponse } from "next/server";
import { buildCustomSlip } from "@/lib/engines/engine3_slipBuilder";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      target_odds = 5.0,
      bookmaker = "SPORTYBET",
      duration = "today",
      sport = "all",
      user_tier = "FREE",
    } = body;

    const horizon = duration === "today" ? "today" : duration === "14_days" ? "14_days" : "30_days";

    const slip = await buildCustomSlip({
      target_odds: Number(target_odds) || 5.0,
      bookmaker: String(bookmaker).toUpperCase().includes("BET9JA") ? "BET9JA" : "SPORTYBET",
      date_horizon: horizon,
      sport_type: sport,
      user_tier,
    });

    return NextResponse.json({
      status: "success",
      message: `Successfully generated ${slip.bookmaker} booking slip ${slip.booking_code} with ${slip.actual_combined_odds} combined odds.`,
      slip,
      data: slip,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ status: "error", message: errorMsg }, { status: 500 });
  }
}

