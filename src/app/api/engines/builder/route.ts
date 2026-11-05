import { NextRequest, NextResponse } from "next/server";
import { buildCustomSlip, CustomBuilderRequest } from "@/lib/engines/engine4_slipBuilder";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body: CustomBuilderRequest = await request.json().catch(() => ({}));

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

    // Record slip creation in Founder Admin Analytics (public.user_saved_tickets & oddora_v2_daily_slips)
    try {
      const supabase = getSupabaseAdmin();
      let effectiveEmail = (
        (body as any).user_email ||
        (body as any).email ||
        ""
      ).toLowerCase().trim();
      let effectiveUserId = (body as any).user_id || (body as any).userId || null;

      if (!effectiveEmail) {
        const authHeader = request.headers.get("authorization");
        if (authHeader?.startsWith("Bearer ")) {
          const token = authHeader.substring(7);
          try {
            const { data: { user: authUser } } = await supabase.auth.getUser(token);
            if (authUser?.email) {
              effectiveEmail = authUser.email.toLowerCase().trim();
              effectiveUserId = authUser.id;
            }
          } catch {}
        }
      }

      const finalLegs = slip.legs_json || slip.legs || [];
      const finalOdds = Number(slip.actual_combined_odds || slip.actual_odds || body.target_odds || 1.0);
      const ticketId = `slip_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      await supabase.from("user_saved_tickets").insert({
        id: ticketId,
        user_id: effectiveUserId,
        user_email: effectiveEmail || "guest@oddora.ai",
        booking_code: generatedCode || "READY",
        share_code: generatedCode || "READY",
        total_odds: finalOdds,
        target_odds: Number(body.target_odds) || 10.0,
        tier: String(body.user_tier || "FREE").toUpperCase(),
        title: `AI Slip Builder (${finalOdds}x)`,
        legs: finalLegs,
        status: "PENDING",
        source: "SLIP_BUILDER",
      });

      await supabase.from("oddora_v2_daily_slips").insert({
        slip_type: "CUSTOM_SOLVER",
        slip_title: `Slip Builder (${finalOdds}x)`,
        target_odds: Number(body.target_odds) || 10.0,
        actual_odds: finalOdds,
        sport: body.sport_type || "multi",
        sporty_code: generatedCode,
        share_url: shareUrl,
        legs: finalLegs,
        is_locked_for_tier: String(body.user_tier || "FREE").toUpperCase(),
        created_date: new Date().toISOString().split("T")[0],
        status: "ACTIVE",
        result_status: "PENDING",
      });
    } catch (auditErr) {
      console.warn("[API Builder] Slip recording notice:", auditErr);
    }

    return NextResponse.json({
      status: slip.status || "success",
      success: true,
      data: slip,
      slip,
      is_pool_insufficient: slip.is_pool_insufficient || false,
      warning: slip.warning,
      suggested_corridor: slip.suggested_corridor,
      suggested_min_probability: slip.suggested_min_probability,
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
      matches: slip.legs_json || slip.legs || [],
      legs_json: slip.legs_json || slip.legs || [],
      total_odds: slip.actual_combined_odds || slip.actual_odds || body.target_odds || 1.0,
      actual_odds: slip.actual_combined_odds || slip.actual_odds || body.target_odds || 1.0,
    });
  } catch (error: any) {
    console.error("[API Builder] Error executing buildCustomSlip:", error);
    return NextResponse.json(
      { status: "error", message: error.message || "Failed to build custom slip." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetOdds = parseFloat(searchParams.get("target_odds") || searchParams.get("targetOdds") || "10");
    const sportsParam = searchParams.get("sports");
    const sportType = searchParams.get("sport_type") || searchParams.get("sport") || "all";
    const mode = (searchParams.get("mode") || searchParams.get("strategy_mode") || "SWEET_SPOT").toUpperCase();
    const minProb = searchParams.get("min_probability") ? parseFloat(searchParams.get("min_probability")!) : undefined;
    const tier = (searchParams.get("tier") || searchParams.get("user_tier") || "FREE").toUpperCase() as any;

    const payload: CustomBuilderRequest = {
      target_odds: targetOdds || 10.0,
      sport_type: sportType,
      sports: sportsParam ? sportsParam.split(",") : undefined,
      strategy_mode: mode,
      min_probability: minProb,
      user_tier: tier,
      auto_optimize: true,
    };

    const slip: any = await buildCustomSlip(payload);
    return NextResponse.json({
      status: "success",
      success: true,
      data: slip,
      slip,
      legs: slip.legs_json || slip.legs || [],
      matches: slip.legs_json || slip.legs || [],
      total_odds: slip.actual_combined_odds || slip.actual_odds || targetOdds,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Failed to solve accumulator slip." },
      { status: 500 }
    );
  }
}
