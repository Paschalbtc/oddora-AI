import { NextRequest, NextResponse } from "next/server";
import { executeEditSlip, EditSlipRequest } from "@/lib/engines/engine4_editSlip";

export async function POST(request: NextRequest) {
  try {
    const body: EditSlipRequest = await request.json();

    if (!body || !body.booking_code) {
      return NextResponse.json(
        { status: "error", message: "booking_code is required." },
        { status: 400 }
      );
    }

    if (!body.mode) {
      return NextResponse.json(
        { status: "error", message: "mode is required (SPLIT_TICKET | LOWEST_PROBABILITY | RANDOM_TRIM | COMBO_HYBRID)." },
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
      { status: 500 }
    );
  }
}
