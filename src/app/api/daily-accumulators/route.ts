import { NextRequest, NextResponse } from "next/server";
import {
  generateAndBookDailySlips,
  getDailySlipsForUI,
} from "@/lib/engines/engine2_dailyOddsAndBankers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function enrichSlip(s: any) {
  const code =
    s.sporty_code ||
    s.sportybet_code ||
    s.booking_code ||
    s.bookingCode ||
    s.code ||
    s.shareCode ||
    "";
  const matches = s.legs_json || s.legs || s.matches || [];
  const actualOdds = Number(s.actual_odds || s.total_odds || s.target_odds) || 2.0;
  return {
    ...s,
    sporty_code: code,
    booking_code: code,
    sportybet_code: code,
    code,
    actual_odds: actualOdds,
    total_odds: actualOdds,
    matches,
    legs: matches,
    legs_json: matches,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tier = (searchParams.get("tier") || "FREE").toUpperCase() as "FREE" | "PRO" | "PREMIUM";
    const force = searchParams.get("force") === "true";

    let slips = await getDailySlipsForUI(tier);

    // Only force regeneration if explicitly requested via ?force=true or if 0 slips were retrieved
    if (force || !slips || slips.length === 0) {
      try {
        console.log(
          `[Daily Accumulators API] Explicit force or empty slips (force: ${force}, count: ${slips?.length || 0}). Auto-generating slips...`
        );
        await generateAndBookDailySlips();
        slips = await getDailySlipsForUI(tier);
      } catch (genErr) {
        console.warn("[Daily Accumulators API] Regeneration fallback notice:", genErr);
      }
    }

    // Attach matches alias to guarantee client compatibility
    const enrichedSlips = (slips || []).map(enrichSlip);

    return NextResponse.json({
      status: "success",
      count: enrichedSlips.length,
      data: enrichedSlips,
      slips: enrichedSlips,
      accumulators: enrichedSlips,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Failed to load daily accumulators." },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const result = await generateAndBookDailySlips();
    const enriched = (result.slips || []).map(enrichSlip);

    return NextResponse.json({
      status: "success",
      slips_generated: result.slips_generated,
      data: enriched,
      slips: enriched,
      accumulators: enriched,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Failed to generate daily accumulators." },
      { status: 500 }
    );
  }
}
