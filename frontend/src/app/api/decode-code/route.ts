import { NextRequest, NextResponse } from "next/server";
import { decodeSportyBetBookingCode } from "@/lib/sportybet";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fdlbnftfylcsjuzqbeuo.supabase.co";
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkbGJuZnRmeWxjc2p1enFiZXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1OTc0NjIsImV4cCI6MjEwODE3MzQ2Mn0.svZdujPkzWNdLm-mJ5XEM8S37JP5euHyoZ5YSt7tRz4";

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookmaker = "SportyBet", code = "" } = body;
    const cleanCode = (code || "").trim().toUpperCase();

    if (!cleanCode) {
      return NextResponse.json({ status: "error", message: "Booking code is required." }, { status: 400 });
    }

    // 1. If SportyBet, call official SportyBet ticket decode API
    if (bookmaker.toLowerCase().includes("sporty")) {
      const decoded = await decodeSportyBetBookingCode(cleanCode);
      if (decoded?.outcomes && decoded.outcomes.length > 0) {
        const legs: any[] = [];
        let combinedOdds = 1.0;

        for (const o of decoded.outcomes) {
          const m = o.markets?.[0];
          const out = m?.outcomes?.[0];
          const odd = parseFloat(out?.odds || "1.50");
          combinedOdds *= odd;

          const matchingSelection = decoded.ticket?.selections?.find(
            (s: any) => s.eventId === o.eventId && String(s.marketId) === String(m?.id)
          );
          const specifier = m?.specifier || matchingSelection?.specifier || null;

          legs.push({
            match: `${o.homeTeamName} vs ${o.awayTeamName}`,
            home_team: o.homeTeamName,
            away_team: o.awayTeamName,
            league: o.sport?.category?.tournament?.name || o.sport?.category?.name || "League",
            market: m?.desc || "1X2",
            selection: out?.desc || "Pick",
            odd: odd,
            confidence_score: 85.0,
            ai_reasoning: "Loaded directly from official SportyBet live ticket.",
            eventId: o.eventId,
            marketId: m?.id,
            outcomeId: out?.id,
            specifier: specifier,
          });
        }

        return NextResponse.json({
          status: "success",
          bookmaker: "SportyBet",
          booking_code: cleanCode,
          share_url: `http://www.sportybet.com/ng/?shareCode=${cleanCode}`,
          total_legs: legs.length,
          combined_odds: Math.round(combinedOdds * 100) / 100,
          legs: legs,
        });
      }
    }

    // 2. Query Supabase for previously saved slip
    const { data: savedSlip } = await (supabase as any)
      .from("generated_slips")
      .select("*")
      .eq("booking_code", cleanCode)
      .limit(1)
      .maybeSingle();

    if (savedSlip && savedSlip.legs_json && savedSlip.legs_json.length > 0) {
      return NextResponse.json({
        status: "success",
        bookmaker: savedSlip.bookmaker || bookmaker,
        booking_code: cleanCode,
        share_url:
          savedSlip.bookmaker === "Bet9ja"
            ? `https://sports.bet9ja.com/mobile/coupon?couponCode=${cleanCode}`
            : `http://www.sportybet.com/ng/?shareCode=${cleanCode}`,
        total_legs: savedSlip.legs_json.length,
        combined_odds: Number(savedSlip.actual_combined_odds),
        legs: savedSlip.legs_json,
      });
    }

    return NextResponse.json({
      status: "error",
      message: `Booking code "${cleanCode}" could not be found or has expired on ${bookmaker}. Please verify your ticket code.`,
    }, { status: 404 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ status: "error", message: errorMsg }, { status: 500 });
  }
}
