import { NextRequest, NextResponse } from "next/server";
import { syncTodayAllMatches, getAllMatchesForUI } from "@/lib/engines/engine1_allMatches";
import { SportType } from "@/lib/sportBrains";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = (searchParams.get("sport") || undefined) as SportType | undefined;
    const tier = (searchParams.get("tier") || "FREE") as "FREE" | "PRO" | "PREMIUM";

    const matches = await getAllMatchesForUI(sport, tier);

    return NextResponse.json({
      status: "success",
      count: matches.length,
      data: matches,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Failed to load matches." },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const result = await syncTodayAllMatches();
    return NextResponse.json({
      status: "success",
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Sync failed." },
      { status: 500 }
    );
  }
}

