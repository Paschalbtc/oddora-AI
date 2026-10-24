import { NextRequest, NextResponse } from "next/server";
import { syncMultiDayFixtures, generate3DailyBankerTickets, getSyncBucket } from "@/lib/apiFootballGatekeeper";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("refresh") === "true";

    const syncInfo = getSyncBucket();
    const allMatches = await syncMultiDayFixtures({ force: forceRefresh });
    const bankerTickets = await generate3DailyBankerTickets(allMatches);

    return NextResponse.json({
      status: "success",
      engine: "3 Dedicated Daily Bankers (2.00x–3.00x Poisson Floor)",
      sync_bucket: syncInfo.syncBucket,
      sync_cycle: syncInfo.cycleIndex,
      sync_cycle_label: syncInfo.cycleLabel,
      today_date: syncInfo.todayDate,
      bankers: bankerTickets,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ status: "error", message: errorMsg }, { status: 500 });
  }
}
