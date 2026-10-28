import { NextRequest, NextResponse } from "next/server";
import { getTodayLeaguesSummary, sync5xDailySchedule } from "@/lib/multiSportScheduleFeed";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get("sport") || "all";
    const forceRefresh = searchParams.get("refresh") === "true";

    if (forceRefresh) {
      await sync5xDailySchedule(true);
    }

    const data = await getTodayLeaguesSummary(sport);

    return NextResponse.json({
      status: "success",
      ...data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Failed to load today's leagues." },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const result = await sync5xDailySchedule(true);
    return NextResponse.json({
      status: "success",
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Failed to sync multi-sport schedule." },
      { status: 500 }
    );
  }
}
