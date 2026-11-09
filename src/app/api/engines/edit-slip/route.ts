import { NextRequest, NextResponse } from "next/server";
import { executeEditSlip, EditSlipRequest } from "@/lib/engines/engine4_editSlip";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body: EditSlipRequest = await request.json().catch(() => ({}));

    if (!body || !body.booking_code) {
      return NextResponse.json(
        { status: "error", message: "booking_code is required. Please paste or enter a valid SportyBet booking code." },
        { status: 400 }
      );
    }

    if (!body.mode) {
      body.mode = body.target_odds ? "TARGET_ODDS" : "LOWEST_PROBABILITY";
    }

    const validModes = ["SPLIT_TICKET", "LOWEST_PROBABILITY", "RANDOM_TRIM", "COMBO_HYBRID", "TARGET_ODDS"];
    if (!validModes.includes(body.mode)) {
      return NextResponse.json(
        { status: "error", message: `Invalid mode "${body.mode}". Allowed modes: ${validModes.join(", ")}.` },
        { status: 400 }
      );
    }

    const result = await executeEditSlip(body);

    return NextResponse.json({
      status: "success",
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Failed to edit slip." },
      { status: 400 }
    );
  }
}

