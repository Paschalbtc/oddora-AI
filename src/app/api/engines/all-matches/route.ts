import { NextRequest, NextResponse } from "next/server";
import { syncTodayAllMatches, syncMatchesForDate, getAllMatchesForUI } from "@/lib/engines/engine1_allMatches";
import { get5xDailySyncSlot } from "@/lib/multiSportScheduleFeed";
import { SportType } from "@/lib/sportBrains";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || undefined;
    const sport = (searchParams.get("sport") || undefined) as SportType | undefined;
    const tier = (searchParams.get("tier") || "FREE") as "FREE" | "PRO" | "PREMIUM";

    const matches = await getAllMatchesForUI(date, sport, tier);
    const slotInfo = get5xDailySyncSlot();

    return NextResponse.json({
      status: "success",
      date: date || new Date().toISOString().split("T")[0],
      sync_slot_badge: "Synced 5x Daily • Multi-Sport Live Feed",
      sync_slot_info: slotInfo,
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

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || undefined;
    const result = date ? await syncMatchesForDate(date, true) : await syncTodayAllMatches(true);
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

