import { NextRequest, NextResponse } from "next/server";
import {
  generateAndBookDailySlips,
  getDailySlipsForUI,
  hasDuplicateLegsInSlip,
} from "@/lib/engines/engine2_dailyOddsAndBankers";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tier = (searchParams.get("tier") || "FREE") as "FREE" | "PRO" | "PREMIUM";
    const force = searchParams.get("force") === "true";

    let slips = await getDailySlipsForUI(tier);

    // If force is requested, or slips missing (< 8), bloated (> 25 legs), or duplicate matches exist, auto-generate clean slips
    const hasBloatedSlip = Boolean(slips && slips.some((s) => (s.legs?.length || 0) > 25));
    const hasDuplicateMatches = Boolean(slips && slips.some(hasDuplicateLegsInSlip));
    const isMissingSlips = !slips || slips.length < 8;

    if (force || isMissingSlips || hasBloatedSlip || hasDuplicateMatches) {
      try {
        console.log(
          `[Daily Slips API] Regenerating slips (force: ${force}, missing: ${isMissingSlips}, bloated: ${hasBloatedSlip}, duplicates: ${hasDuplicateMatches})...`
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

