import { NextRequest, NextResponse } from "next/server";
import {
  bookUniversalSlip,
  decodeAnyBookingCode,
} from "@/lib/engines/bookingEngine";
import { executeEditSlip } from "@/lib/engines/engine4_editSlip";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action = "generate", bookmaker = "SportyBet", selections = [], code = "", mode, remove_count, split_parts } = body;

    // 1. GENERATE
    if (action === "generate") {
      if (!Array.isArray(selections) || selections.length === 0) {
        return NextResponse.json(
          { status: "error", message: "No selections provided for booking code generation." },
          { status: 400 }
        );
      }

      const booked = await bookUniversalSlip(selections);

      return NextResponse.json({
        status: "success",
        bookmaker: "SportyBet",
        booking_code: booked.sportybet_code,
        sporty_code: booked.sportybet_code,
        share_url: booked.sporty_url,
        sporty_url: booked.sporty_url,
        actual_odds: booked.actual_odds,
        legs_count: booked.legs_count,
        legs: booked.legs,
        is_verified_live: booked.is_verified_live,
      });
    }

    // 2. DECODE
    if (action === "decode") {
      const cleanCode = (code || "").trim();
      if (!cleanCode) {
        return NextResponse.json(
          { status: "error", message: "Booking code is required." },
          { status: 400 }
        );
      }

      const decoded = await decodeAnyBookingCode(cleanCode, bookmaker);
      if (decoded.status === "error") {
        return NextResponse.json(decoded, { status: 404 });
      }

      return NextResponse.json(decoded);
    }

    // 3. EDIT / SPLIT
    if (action === "edit" || mode) {
      const cleanCode = (code || body.booking_code || "").trim();
      const result = await executeEditSlip({
        booking_code: cleanCode,
        bookmaker: bookmaker as any,
        mode: mode || "LOWEST_PROBABILITY",
        remove_count: Number(remove_count) || 2,
        split_parts: Number(split_parts) || 2,
      });

      return NextResponse.json({
        status: "success",
        data: result,
      });
    }

    return NextResponse.json({ status: "error", message: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Bookmaker engine error." },
      { status: 500 }
    );
  }
}

