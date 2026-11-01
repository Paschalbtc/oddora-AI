import { NextRequest, NextResponse } from "next/server";
import { buildCustomSlip } from "@/lib/engines/engine3_slipBuilder";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    const slip: any = await buildCustomSlip({
      target_odds: Number(target_odds) || 5.0,
      bookmaker: "SPORTYBET",
      date_horizon: horizon,
      sport_type: sport,
      user_tier,
    });

    const generatedCode =
      slip.sportybet_code ||
      slip.sportybetCode ||
      slip.bookingCode ||
      slip.shareCode ||
      slip.code ||
      slip.sporty_code ||
      slip.booking_code ||
      slip.sportyCode ||
      "";
    const shareUrl =
      slip.sporty_url ||
      slip.share_url ||
      slip.shareUrl ||
      (generatedCode ? `https://www.sportybet.com/ng/?shareCode=${generatedCode}` : "");

    slip.code = generatedCode;
    slip.shareCode = generatedCode;
    slip.bookingCode = generatedCode;
    slip.sportybet_code = generatedCode;
    slip.sportybetCode = generatedCode;
    slip.sportyCode = generatedCode;
    slip.booking_code = generatedCode;
    slip.sporty_url = shareUrl;
    slip.share_url = shareUrl;

    return NextResponse.json({
      status: "success",
      success: true,
      message: `Successfully generated ${slip.bookmaker} booking slip ${generatedCode} with ${slip.actual_combined_odds} combined odds.`,
      slip,
      data: slip,
      code: generatedCode,
      shareCode: generatedCode,
      bookingCode: generatedCode,
      sportybet_code: generatedCode,
      sportybetCode: generatedCode,
      sporty_code: generatedCode,
      sportyCode: generatedCode,
      booking_code: generatedCode,
      share_url: shareUrl,
      sporty_url: shareUrl,
      shareUrl,
      sportyUrl: shareUrl,
      legs: slip.legs_json || slip.legs || [],
      legs_json: slip.legs_json || slip.legs || [],
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ status: "error", message: errorMsg }, { status: 500 });
  }
}

