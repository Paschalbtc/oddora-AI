import { NextRequest, NextResponse } from "next/server";
import { sync5xDailySchedule, get5xDailySyncSlot } from "@/lib/multiSportScheduleFeed";

export const dynamic = "force-dynamic";

let last2hrSyncTimestamp = 0;
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  return handleSync(request);
}

export async function GET(request: NextRequest) {
  return handleSync(request);
}

async function handleSync(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";
    const now = Date.now();

    if (!force && last2hrSyncTimestamp > 0 && now - last2hrSyncTimestamp < TWO_HOURS_MS) {
      const remainingMinutes = Math.round((TWO_HOURS_MS - (now - last2hrSyncTimestamp)) / 60000);
      return NextResponse.json({
        status: "skipped",
        message: `Sync throttled. Last sync was ${Math.round((now - last2hrSyncTimestamp) / 60000)}m ago. Next sync in ~${remainingMinutes}m.`,
        last_sync: new Date(last2hrSyncTimestamp).toISOString(),
      });
    }

    const result = await sync5xDailySchedule(true);
    last2hrSyncTimestamp = Date.now();

    const slotMeta = get5xDailySyncSlot(new Date());

    return NextResponse.json({
      status: "success",
      source: "background_2hr_sync_engine",
      synced_count: result.synced_count,
      slot_label: slotMeta.slotLabel,
      next_sync: new Date(last2hrSyncTimestamp + TWO_HOURS_MS).toISOString(),
      message: result.message,
    });
  } catch (error: any) {
    console.error("2-Hour Sync Error:", error);
    return NextResponse.json(
      { status: "error", message: error.message || "Failed to execute 2-hour multi-sport sync" },
      { status: 500 }
    );
  }
}

