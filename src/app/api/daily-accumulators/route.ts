import { NextRequest, NextResponse } from "next/server";
import {
  generateAndBookDailySlips,
  getDailySlipsForUI,
  hasDuplicateLegsInSlip,
  isMonochromaticSlip,
} from "@/lib/engines/engine2_dailyOddsAndBankers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tier = (searchParams.get("tier") || "FREE").toUpperCase() as "FREE" | "PRO" | "PREMIUM";
    const force = searchParams.get("force") === "true";

    let slips = await getDailySlipsForUI(tier);

    const hasBloatedSlip = Boolean(slips && slips.some((s) => (s.legs?.length || 0) > 25));
    const hasDuplicateMatches = Boolean(slips && slips.some(hasDuplicateLegsInSlip));
    const hasMonochromatic = Boolean(slips && slips.some(isMonochromaticSlip));
    const isMissingSlips = !slips || slips.length < 8;
    const hasEmptySlips = Boolean(
      slips &&
        slips.some(
          (s) =>
            (!s.legs || s.legs.length === 0) &&
            (!s.legs_json || s.legs_json.length === 0) ||
            Number(s.actual_odds) <= 1.05
        )
    );

    if (force || isMissingSlips || hasBloatedSlip || hasDuplicateMatches || hasMonochromatic || hasEmptySlips) {
      try {
        console.log(
          `[Daily Accumulators API] Auto-generating slips (force: ${force}, missing: ${isMissingSlips}, empty: ${hasEmptySlips})...`
        );
        await generateAndBookDailySlips();
        slips = await getDailySlipsForUI(tier);
      } catch (genErr) {
        console.warn("[Daily Accumulators API] Regeneration fallback notice:", genErr);
      }
    }

    // Attach matches alias to guarantee client compatibility
    const enrichedSlips = (slips || []).map((s: any) => ({
      ...s,
      matches: s.legs_json || s.legs || [],
      legs: s.legs_json || s.legs || [],
      legs_json: s.legs_json || s.legs || [],
    }));

    return NextResponse.json({
      status: "success",
      count: enrichedSlips.length,
      data: enrichedSlips,
      slips: enrichedSlips,
      accumulators: enrichedSlips,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Failed to load daily accumulators." },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const result = await generateAndBookDailySlips();
    const enriched = (result.slips || []).map((s: any) => ({
      ...s,
      matches: s.legs_json || s.legs || [],
      legs: s.legs_json || s.legs || [],
      legs_json: s.legs_json || s.legs || [],
    }));

    return NextResponse.json({
      status: "success",
      slips_generated: result.slips_generated,
      data: enriched,
      slips: enriched,
      accumulators: enriched,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Failed to generate daily accumulators." },
      { status: 500 }
    );
  }
}

