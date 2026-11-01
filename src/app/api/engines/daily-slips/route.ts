import { NextRequest, NextResponse } from "next/server";
import {
  generateAndBookDailySlips,
  getDailySlipsForUI,
  hasDuplicateLegsInSlip,
  isMonochromaticSlip,
} from "@/lib/engines/engine2_dailyOddsAndBankers";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tier = (searchParams.get("tier") || "FREE") as "FREE" | "PRO" | "PREMIUM";
    const force = searchParams.get("force") === "true";

    let slips = await getDailySlipsForUI(tier);

    // If force is requested, or slips missing (< 8), bloated (> 25 legs), duplicate matches, or monochromatic, auto-generate clean diversified slips
    const hasBloatedSlip = Boolean(slips && slips.some((s) => (s.legs?.length || 0) > 25));
    const hasDuplicateMatches = Boolean(slips && slips.some(hasDuplicateLegsInSlip));
    const hasMonochromatic = Boolean(slips && slips.some(isMonochromaticSlip));
    const isMissingSlips = !slips || slips.length < 8;

    if (force || isMissingSlips || hasBloatedSlip || hasDuplicateMatches || hasMonochromatic) {
      try {
        console.log(
          `[Daily Slips API] Regenerating slips (force: ${force}, missing: ${isMissingSlips}, bloated: ${hasBloatedSlip}, duplicates: ${hasDuplicateMatches}, monochromatic: ${hasMonochromatic})...`
        );
        await generateAndBookDailySlips();
        slips = await getDailySlipsForUI(tier);
      } catch (genErr) {
        console.warn("Auto-generation of daily slips triggered fallback:", genErr);
      }
    }

    return NextResponse.json({
      status: "success",
      count: slips.length,
      data: slips,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Failed to load daily slips." },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const result = await generateAndBookDailySlips();
    return NextResponse.json({
      status: "success",
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Failed to generate slips." },
      { status: 500 }
    );
  }
}

