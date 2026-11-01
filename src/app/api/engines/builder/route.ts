import { NextRequest, NextResponse } from "next/server";
import { buildCustomSlip, CustomBuilderRequest } from "@/lib/engines/engine3_slipBuilder";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body: CustomBuilderRequest = await request.json();

    if (!body || (!body.target_odds && !body.is_auto_odds)) {
      return NextResponse.json(
        { status: "error", message: "Target odds parameter is required." },
        { status: 400 }
      );
    }

    if (!body.target_odds && body.is_auto_odds) {
      body.target_odds = 10.0;
    }

    const slip: any = await buildCustomSlip(body);

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

