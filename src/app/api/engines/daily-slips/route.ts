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

    // Only force regeneration if explicitly requested via ?force=true or if 0 slips were retrieved
    if (force || !slips || slips.length === 0) {
      try {
        console.log(
          `[Daily Slips API] Explicit force or empty slips (force: ${force}, count: ${slips?.length || 0}). Regenerating slips...`
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

