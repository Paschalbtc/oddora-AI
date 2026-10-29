import { NextRequest, NextResponse } from "next/server";
import { buildCustomSlip, CustomBuilderRequest } from "@/lib/engines/engine3_slipBuilder";

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

    const slip = await buildCustomSlip(body);

    return NextResponse.json({
      status: "success",
      data: slip,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Failed to build custom slip." },
      { status: 500 }
    );
  }
}

