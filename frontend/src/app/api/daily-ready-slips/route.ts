import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { generateMathematicalAccumulatorSlip } from "@/lib/sportybet";
import { getSyncBucket } from "@/lib/apiFootball";
import { persistDailyReadySlips } from "@/lib/platformHistory";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface DailySlipsCache {
  syncBucket: string;
  bookmaker: string;
  timestamp: number;
  data: any;
}

const _slipsMemoryCache: Record<string, DailySlipsCache> = {};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookmaker = searchParams.get("bookmaker") || "SportyBet";
  const bmType = bookmaker.toLowerCase().includes("bet9ja") ? "Bet9ja" : "SportyBet";
  const forceRefresh = searchParams.get("refresh") === "true";

  const { syncBucket, cycleIndex, cycleLabel, todayDate } = getSyncBucket();
  const cacheKey = `${syncBucket}_${bmType}`;
  const diskCacheFile = path.join("/tmp", `oddora_daily_slips_${cacheKey}.json`);

  // Check in-memory & disk cache for current 8-hour cycle
  if (!forceRefresh) {
    if (_slipsMemoryCache[cacheKey]) {
      return NextResponse.json(_slipsMemoryCache[cacheKey].data);
    }
    if (fs.existsSync(diskCacheFile)) {
      try {
        const fileContent = fs.readFileSync(diskCacheFile, "utf-8");
        const parsed: DailySlipsCache = JSON.parse(fileContent);
        if (parsed.syncBucket === syncBucket && parsed.bookmaker === bmType) {
          _slipsMemoryCache[cacheKey] = parsed;
          return NextResponse.json(parsed.data);
        }
      } catch {
        // Fall back to generation
      }
    }
  }

  try {
    // Generate 4 distinct tiered slips in parallel with real live games for today
    // Free 3x-5x Banker, VIP 10x, VIP 20x, VIP 50x
    const [bankerSlip, vip10Slip, vip20Slip, vip50Slip] = await Promise.all([
      generateMathematicalAccumulatorSlip({ targetOdds: 3.5, bookmaker: bmType, timeframe: "today" }),
      generateMathematicalAccumulatorSlip({ targetOdds: 10.0, bookmaker: bmType, timeframe: "today" }),
      generateMathematicalAccumulatorSlip({ targetOdds: 20.0, bookmaker: bmType, timeframe: "today" }),
      generateMathematicalAccumulatorSlip({ targetOdds: 50.0, bookmaker: bmType, timeframe: "3days" }),
    ]);

    const resultData = {
      status: "success",
      generated_at: new Date().toISOString(),
      generated_date: todayDate,
      sync_bucket: syncBucket,
      sync_cycle: cycleIndex,
      sync_cycle_label: cycleLabel,
      bookmaker: bmType,
      slips: [
        {
          id: "banker-daily",
          tier: "FREE",
          title: "Free 3x-5x Banker",
          subtitle: "High-probability conservative accumulator (Zero-Risk Anchor)",
          target_odds: 3.5,
          is_vip_only: false,
          badge: "FREE 3x-5x BANKER",
          badge_color: "emerald",
          slip: bankerSlip,
        },
        {
          id: "vip-10x-daily",
          tier: "VIP",
          title: "VIP 10x Accumulator",
          subtitle: "Balanced 10x multiplier targeting steady compounding ROI",
          target_odds: 10.0,
          is_vip_only: true,
          badge: "VIP 10x",
          badge_color: "emerald",
          slip: vip10Slip,
        },
        {
          id: "vip-20x-daily",
          tier: "VIP",
          title: "VIP 20x Syndicate",
          subtitle: "Quantitative value accumulator across European leagues",
          target_odds: 20.0,
          is_vip_only: true,
          badge: "VIP 20x",
          badge_color: "amber",
          slip: vip20Slip,
        },
        {
          id: "vip-50x-daily",
          tier: "VIP",
          title: "VIP 50x Multiplier",
          subtitle: "Aggressive multi-day 50x value ticket",
          target_odds: 50.0,
          is_vip_only: true,
          badge: "VIP 50x",
          badge_color: "purple",
          slip: vip50Slip,
        },
      ],
    };

    // Save to memory & disk cache
    const cachePayload: DailySlipsCache = {
      syncBucket,
      bookmaker: bmType,
      timestamp: Date.now(),
      data: resultData,
    };
    _slipsMemoryCache[cacheKey] = cachePayload;
    try {
      fs.writeFileSync(diskCacheFile, JSON.stringify(cachePayload), "utf-8");
    } catch {
      // Non-blocking
    }

    // Persist real slips to platform history for Midnight Autopsy
    persistDailyReadySlips(todayDate, resultData.slips, syncBucket).catch(() => {});

    return NextResponse.json(resultData);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ status: "error", message: errorMsg }, { status: 500 });
  }
}
