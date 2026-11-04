import { NextRequest, NextResponse } from "next/server";
import { buildCustomSlip, CustomBuilderRequest } from "@/lib/engines/engine3_slipBuilder";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body: any = await request.json().catch(() => ({}));
    const targetOdds = Number(body.target_odds || body.targetOdds || (body.is_auto_odds ? 10.0 : 0));

    if (!targetOdds && !body.is_auto_odds) {
      return NextResponse.json(
        { status: "error", message: "Target odds parameter is required." },
        { status: 400 }
      );
    }

    const payload: CustomBuilderRequest = {
      ...body,
      target_odds: targetOdds || 10.0,
      sport_type: body.sport_type || body.sport || "all",
      strategy_mode:
        body.strategy_mode ||
        (body.mode === "banker" || body.mode === "pure_banker" ? "PURE_BANKER" : "SWEET_SPOT"),
      user_tier: (body.user_tier || body.tier || "FREE").toUpperCase(),
    };

    const slip: any = await buildCustomSlip(payload);

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

    // Populate all aliases directly on slip object
    slip.code = generatedCode;
    slip.shareCode = generatedCode;
    slip.bookingCode = generatedCode;
    slip.sportybet_code = generatedCode;
    slip.sportybetCode = generatedCode;
    slip.sportyCode = generatedCode;
    slip.booking_code = generatedCode;
    slip.sporty_url = shareUrl;
    slip.share_url = shareUrl;
    slip.sportyUrl = shareUrl;
    slip.shareUrl = shareUrl;

    return NextResponse.json({
      status: "success",
      success: true,
      data: slip,
      slip,
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
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Failed to build custom slip." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetOdds = parseFloat(searchParams.get("target_odds") || searchParams.get("targetOdds") || "10");
  const sport = searchParams.get("sport") || searchParams.get("sport_type") || "all";
  const mode = (searchParams.get("mode") || searchParams.get("strategy_mode") || "SWEET_SPOT").toUpperCase();
  const isBanker = mode === "BANKER" || mode === "PURE_BANKER";
  const tier = (searchParams.get("tier") || "FREE").toUpperCase() as any;

  try {
    const slip = await buildCustomSlip({
      target_odds: targetOdds,
      sport_type: sport,
      strategy_mode: isBanker ? "PURE_BANKER" : "SWEET_SPOT",
      user_tier: tier,
    });
    return NextResponse.json({ status: "success", data: slip, slip });
  } catch (err: any) {
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}

