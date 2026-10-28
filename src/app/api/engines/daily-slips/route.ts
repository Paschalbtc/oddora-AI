import { NextRequest, NextResponse } from "next/server";
import {
  generateAndBookDailySlips,
  getDailySlipsForUI,
} from "@/lib/engines/engine2_dailyOddsAndBankers";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tier = (searchParams.get("tier") || "FREE") as "FREE" | "PRO" | "PREMIUM";

    let slips = await getDailySlipsForUI(tier);

    // If slips are not yet generated for today, auto-generate them
    if (!slips || slips.length === 0) {
      try {
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

