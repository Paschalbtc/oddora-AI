import { NextRequest, NextResponse } from "next/server";
import {
  bookUniversalSlip,
  decodeAnyBookingCode,
} from "@/lib/engines/bookingEngine";
import { executeEditSlip } from "@/lib/engines/engine4_editSlip";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  let requestSelections: any[] = [];
  try {
    const body = await request.json();
    const { action = "generate", bookmaker = "SportyBet", selections = [], code = "", mode, remove_count, split_parts } = body;
    requestSelections = selections;

    // 1. GENERATE
    if (action === "generate") {
      if (!Array.isArray(selections) || selections.length === 0) {
        return NextResponse.json(
          { status: "error", message: "No selections provided for booking code generation." },
          { status: 400 }
        );
      }

      // Strict Deduplication: MAX 1 SELECTION PER EVENT ID & MATCH
      const seenEventIds = new Set<string>();
      const seenMatches = new Set<string>();
      const deduplicatedSelections: any[] = [];

      for (const sel of selections) {
        if (!sel) continue;
        const rawEvId = sel.eventId || sel.sportybet_selection?.eventId || sel.match_id || sel.matchId;
        const cleanEvId = rawEvId ? String(rawEvId).trim() : null;
        const matchKey = (sel.home_team && sel.away_team)
          ? `${sel.home_team.trim().toLowerCase()}_vs_${sel.away_team.trim().toLowerCase()}`
          : (sel.match || "").trim().toLowerCase();

        if (cleanEvId && seenEventIds.has(cleanEvId)) continue;
        if (matchKey && seenMatches.has(matchKey)) continue;

        if (cleanEvId) seenEventIds.add(cleanEvId);
        if (matchKey) seenMatches.add(matchKey);
        deduplicatedSelections.push(sel);
      }

      console.log(`[/api/bookmaker] Dispatching ${deduplicatedSelections.length} selections:`, JSON.stringify(deduplicatedSelections.map(s => ({
        eventId: s.eventId || s.match_id,
        match: s.match || `${s.home_team} vs ${s.away_team}`,
        market: s.market,
        selection: s.selection
      }))));

      const booked = await bookUniversalSlip(deduplicatedSelections, {
        preserve_exact_legs: true,
      });

      let generatedCode =
        booked.sportybet_code ||
        booked.sporty_code ||
        booked.booking_code ||
        booked.code ||
        booked.shareCode ||
        "";

      console.log(`[/api/bookmaker] SportyBet shareCode returned: "${generatedCode}" | Verified legs count: ${booked.legs?.length || 0}`);

      // SportyBet live order share validation
      if (!generatedCode || generatedCode.trim().length === 0 || booked.status === "error") {
        return NextResponse.json(
          {
            status: "error",
            success: false,
            message: booked.error_message || "SportyBet rejected the selections or could not generate a booking code.",
          },
          { status: 400 }
        );
      }

      const shareUrl =
        booked.sporty_url ||
        booked.share_url ||
        (generatedCode ? `https://www.sportybet.com/ng/?shareCode=${generatedCode}` : "");

      return NextResponse.json({
        status: "success",
        success: true,
        bookmaker: "SportyBet",
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
        actual_odds: booked.actual_odds,
        total_odds: booked.total_odds || booked.actual_odds,
        legs_count: booked.legs_count,
        legs: booked.legs || booked.legs_json || [],
        legs_json: booked.legs_json || booked.legs || [],
        accepted_event_ids: (booked as any).accepted_event_ids || (booked.legs || []).map((l: any) => l.eventId),
        acceptedEventIds: (booked as any).acceptedEventIds || (booked.legs || []).map((l: any) => l.eventId),
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
    console.error("[Bookmaker Route] Caught exception:", error);
    return NextResponse.json(
      { status: "error", success: false, message: error?.message || "Bookmaker engine error." },
      { status: 500 }
    );
  }
}

