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

    // Verify daily slips for today: regenerate if missing or containing duplicate matches
    try {
      const { hasDuplicateLegsInSlip, generateAndBookDailySlips } = await import(
        "@/lib/engines/engine2_dailyOddsAndBankers"
      );
      const supabase = (await import("@/lib/supabase")).getSupabaseClient();
      const todayStr = new Date().toISOString().split("T")[0];
      const { data: dbSlips } = await supabase
        .from("oddora_v2_daily_slips")
        .select("*")
        .eq("slip_date", todayStr);

      const needsRegen =
        !dbSlips ||
        dbSlips.length < 8 ||
        dbSlips.some((s: any) => Number(s.match_count) > 25 || hasDuplicateLegsInSlip(s));

      if (needsRegen) {
        console.log("[2hr Sync] Triggering daily slips regeneration to maintain 1-to-1 match parity...");
        await generateAndBookDailySlips();
      }
    } catch (slipErr) {
      console.warn("[2hr Sync] Notice while verifying daily slips:", slipErr);
    }

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

